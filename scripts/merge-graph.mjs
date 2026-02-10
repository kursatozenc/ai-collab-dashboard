/**
 * merge-graph.mjs
 * Merges ingest-candidates into the research graph and recomputes clusters from data.
 * - TF-IDF on title + summary for all items (existing + ingest)
 * - k-means clustering → real cluster assignments
 * - PCA to 2D for radar layout
 * - Cluster labels from top terms per cluster (no dummy names)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { kmeans } from "ml-kmeans";
import { PCA } from "ml-pca";

const GRAPH_PATH = path.resolve("src/data/research-graph.json");
const CANDIDATES_PATH = path.resolve("src/data/ingest-candidates.json");

const args = new Set(process.argv.slice(2));
const kArg = [...args].find((a) => a.startsWith("--k="));
const K = kArg ? Number.parseInt(kArg.split("=")[1], 10) : 10;
const dryRun = args.has("--dry-run");
const maxVocab = 600;
const viewBox = { xMin: 80, yMin: 60, xMax: 920, yMax: 640 };

// ── Tokenize ─────────────────────────────────────────────────────────────
const STOP = new Set([
  // English stopwords
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "is", "was", "are", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "must", "shall", "can", "need", "dare", "ought", "used",
  // Pronouns, determiners, common short words
  "this", "that", "these", "those", "it", "its", "we", "our", "they", "their",
  "not", "no", "also", "however", "such", "more", "most", "than", "very",
  "about", "into", "over", "after", "before", "between", "through", "during",
  "both", "each", "other", "some", "all", "any", "new", "first", "last", "only",
  "one", "two", "how", "what", "when", "which", "who",
  // Academic filler (appears uniformly across papers)
  "using", "based", "approach", "proposed", "results", "method", "methods",
  "paper", "study", "research", "show", "shows", "shown", "et", "al",
  // HTML / web / file artifacts
  "img", "src", "alt", "div", "href", "http", "https", "www", "html", "css",
  "webp", "png", "jpg", "jpeg", "svg", "gif", "pdf", "url", "max", "format",
  "com", "org", "io", "net",
  // CDN / storage artifacts
  "storage", "googleapis", "gweb", "uniblog", "publish", "prod", "images",
  // Tech company / product names (noise for cluster differentiation)
  "gpt", "codex", "openai", "google", "microsoft", "meta", "github", "arxiv",
  "doi", "chatgpt", "gemini", "claude", "llama", "anthropic", "deepmind",
  // Blog post / press release filler
  "introducing", "announcing", "launched", "released", "update", "updates",
  "blog", "post", "article", "report", "press",
  // Generic tech terms that don't differentiate topics
  "system", "systems", "model", "models", "data", "analysis", "information",
  "available", "access", "use", "enable", "features", "feature", "tools", "tool",
  "users", "applications", "application", "platform", "service", "services",
  "image", "images", "video", "text", "content", "generate", "generation",
  "language", "large", "frontier", "enterprise", "transform", "transformer",
  // Common abbreviations / short noise tokens that leak from papers
  "ie", "eg", "cf", "vs", "etc", "fig", "al", "re", "pre", "non",
  // Vague / generic terms that don't differentiate research topics
  "community", "communities", "countries", "review", "reviews",
  "world", "people", "latest", "today", "year", "years",
  "work", "working", "works", "making", "made", "make",
  "way", "ways", "things", "thing", "part", "time",
  "different", "important", "possible", "potential", "possible",
  "help", "helps", "helping", "need", "needs",
  "across", "many", "well", "like", "just", "even", "still",
  "high", "low", "best", "better", "able",
]);

function tokenize(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .replace(/<[^>]+>/g, " ")         // strip HTML tags
    .replace(/https?:\/\/\S+/g, " ")  // strip URLs
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

// ── TF-IDF ───────────────────────────────────────────────────────────────
function buildVocabulary(docs, maxTerms) {
  const df = new Map();
  for (const tokens of docs) {
    const seen = new Set(tokens);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  return [...df.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([t]) => t);
}

function tfIdfMatrix(docs, vocab) {
  const N = docs.length;
  const idf = vocab.map((term) => {
    const n = docs.filter((tokens) => tokens.includes(term)).length;
    return Math.log((N + 1) / (n + 1)) + 1;
  });
  return docs.map((tokens) => {
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    return vocab.map((term, i) => {
      const tfVal = (tf.get(term) || 0) / (tokens.length || 1);
      return tfVal * idf[i];
    });
  });
}

// ── Preferred terms for human–AI collaboration cluster labels (boosted so labels stay on-theme) ──
const LABEL_THEME_TERMS = new Set([
  // Domain-relevant terms that differentiate clusters (boosted 1.6×)
  // Note: "human" and "ai" omitted — they appear in nearly every doc and are
  // handled by the ubiquity penalty instead.
  // Note: no hyphenated terms — the tokenizer strips hyphens before matching.
  "collaboration", "team", "teaming", "trust", "delegation",
  "communication", "learning", "assistive", "interaction", "agents", "agent",
  "decision", "support", "design", "transparency", "ethics",
  "explainability", "control", "automation", "coordination", "mixed", "initiative",
  "cooperative", "partnership", "feedback", "calibration",
  "robot", "robotics", "autonomy", "oversight", "safety",
  "workflow", "accountability", "fairness",
]);

// ── Cluster labels and rationale (top terms; theme terms boosted) ──
function topTermsPerCluster(docs, vocab, matrix, clusterAssignments) {
  const k = Math.max(...clusterAssignments) + 1;

  // Cluster-level frequency: in how many clusters does each term appear prominently?
  // Terms that appear everywhere (like "ai", "human") get penalized.
  const clusterTermPresence = vocab.map((_, termIdx) => {
    let clustersPresent = 0;
    for (let c = 0; c < k; c++) {
      const indices = clusterAssignments
        .map((assign, i) => (assign === c ? i : -1))
        .filter((i) => i >= 0);
      const avgScore =
        indices.reduce((sum, i) => sum + matrix[i][termIdx], 0) /
        (indices.length || 1);
      if (avgScore > 0.01) clustersPresent++;
    }
    return clustersPresent;
  });

  const result = [];
  for (let c = 0; c < k; c++) {
    const indices = clusterAssignments
      .map((assign, i) => (assign === c ? i : -1))
      .filter((i) => i >= 0);
    const termScores = vocab.map((_, termIdx) => {
      let sum = 0;
      for (const i of indices) sum += matrix[i][termIdx];
      const score = sum / (indices.length || 1);
      const term = vocab[termIdx].toLowerCase();

      // Theme boost: domain-relevant terms get 1.6×
      const boost = LABEL_THEME_TERMS.has(term) ? 1.6 : 1;

      // Ubiquity penalty: terms in >50% of clusters are poor differentiators
      const presence = clusterTermPresence[termIdx];
      const ubiquityPenalty =
        presence > k * 0.5 ? 0.3 : presence > k * 0.35 ? 0.6 : 1.0;

      return [termIdx, score * boost * ubiquityPenalty];
    });
    termScores.sort((a, b) => b[1] - a[1]);
    const top = termScores
      .slice(0, 10)
      .filter(([, s]) => s > 0)
      .map(([idx]) => vocab[idx]);
    // Deduplicate morphological variants (team/teams/teaming, explain/explanations)
    const isStemDuplicate = (term, selected) =>
      selected.some(
        (s) =>
          term.startsWith(s) || s.startsWith(term) ||
          term.replace(/s$/, "") === s.replace(/s$/, "")
      );
    const topDeduped = [];
    for (const t of top) {
      if (topDeduped.length >= 3) break;
      if (!isStemDuplicate(t, topDeduped)) topDeduped.push(t);
    }
    const topThree = topDeduped;
    const label =
      topThree.length >= 2
        ? topThree
            .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
            .join(" & ")
        : topThree[0]
          ? topThree[0].charAt(0).toUpperCase() + topThree[0].slice(1)
          : `Cluster ${c + 1}`;
    result.push({ label, topTerms: top.slice(0, 5) });
  }
  return result;
}

const MIN_CLUSTER_SIZE = 3;

// ── Merge clusters with fewer than MIN_CLUSTER_SIZE items into nearest cluster ──
function mergeSmallClusters(points2d, clusterAssignments, minSize = MIN_CLUSTER_SIZE) {
  let k = Math.max(...clusterAssignments) + 1;
  const n = points2d.length;
  const counts = new Array(k).fill(0);
  const centroids = [];
  for (let c = 0; c < k; c++) centroids.push([0, 0]);
  for (let i = 0; i < n; i++) {
    const c = clusterAssignments[i];
    counts[c]++;
    centroids[c][0] += points2d[i][0];
    centroids[c][1] += points2d[i][1];
  }
  for (let c = 0; c < k; c++) {
    if (counts[c] > 0) {
      centroids[c][0] /= counts[c];
      centroids[c][1] /= counts[c];
    }
  }

  const assignments = [...clusterAssignments];
  while (true) {
    const small = counts.findIndex((cnt, c) => cnt > 0 && cnt < minSize);
    if (small === -1) break;
    let nearest = -1;
    let minDist = Infinity;
    for (let c2 = 0; c2 < k; c2++) {
      if (c2 === small || counts[c2] === 0) continue;
      const dx = centroids[c2][0] - centroids[small][0];
      const dy = centroids[c2][1] - centroids[small][1];
      const d = dx * dx + dy * dy;
      if (d < minDist) {
        minDist = d;
        nearest = c2;
      }
    }
    if (nearest === -1) break;
    for (let i = 0; i < n; i++) {
      if (assignments[i] === small) assignments[i] = nearest;
    }
    counts[nearest] += counts[small];
    counts[small] = 0;
  }

  const oldToNew = new Map();
  let newK = 0;
  for (let c = 0; c < k; c++) {
    if (counts[c] > 0) oldToNew.set(c, newK++);
  }
  const remapped = assignments.map((c) => oldToNew.get(c));
  return { clusterAssignments: remapped, k: newK };
}

// ── Scale 2D to viewBox ───────────────────────────────────────────────────
function scaleToViewBox(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  return points.map(([x, y]) => [
    viewBox.xMin + ((x - minX) / rangeX) * (viewBox.xMax - viewBox.xMin),
    viewBox.yMin + ((y - minY) / rangeY) * (viewBox.yMax - viewBox.yMin),
  ]);
}

// ── Neat composition: inner + outer ring so center is filled, not empty orbital ──
function applyNeatComposition(points2d, clusterAssignments, k) {
  const n = points2d.length;
  const centroids = [];
  const counts = [];
  for (let c = 0; c < k; c++) {
    centroids.push([0, 0]);
    counts.push(0);
  }
  for (let i = 0; i < n; i++) {
    const c = clusterAssignments[i];
    centroids[c][0] += points2d[i][0];
    centroids[c][1] += points2d[i][1];
    counts[c]++;
  }
  const centerX = (viewBox.xMin + viewBox.xMax) / 2;
  const centerY = (viewBox.yMin + viewBox.yMax) / 2;
  for (let c = 0; c < k; c++) {
    if (counts[c] > 0) {
      centroids[c][0] /= counts[c];
      centroids[c][1] /= counts[c];
    } else {
      centroids[c][0] = centerX;
      centroids[c][1] = centerY;
    }
  }

  const spanX = viewBox.xMax - viewBox.xMin;
  const spanY = viewBox.yMax - viewBox.yMin;
  const innerCount = Math.max(1, Math.floor(k * 0.35));
  const outerCount = k - innerCount;
  const innerRadiusX = spanX * 0.22;
  const innerRadiusY = spanY * 0.22;
  const outerRadiusX = spanX * 0.45;
  const outerRadiusY = spanY * 0.45;

  const targetPositions = [];
  for (let i = 0; i < k; i++) {
    const onInner = i < innerCount;
    const ringN = onInner ? innerCount : outerCount;
    const ringStart = onInner ? 0 : innerCount;
    const ringIndex = i - ringStart;
    const angle = (2 * Math.PI * ringIndex) / ringN - Math.PI / 2;
    const rx = onInner ? innerRadiusX : outerRadiusX;
    const ry = onInner ? innerRadiusY : outerRadiusY;
    targetPositions.push([
      centerX + rx * Math.cos(angle),
      centerY + ry * Math.sin(angle),
    ]);
  }

  const spreadScale = 0.48;
  const newPoints = [];
  for (let i = 0; i < n; i++) {
    const c = clusterAssignments[i];
    const [ox, oy] = points2d[i];
    const [cx, cy] = centroids[c];
    const [tx, ty] = targetPositions[c];
    newPoints.push([
      tx + spreadScale * (ox - cx),
      ty + spreadScale * (oy - cy),
    ]);
  }
  return newPoints;
}

// ── Human–AI collaboration relevance: keep only items related to the theme ───
const HUMAN_AI_PHRASES = [
  "human-ai",
  "human ai",
  "human–ai",
  "human-machine",
  "human machine",
  "human-agent",
  "human agent",
  "human in the loop",
  "human-in-the-loop",
  "human-AI collaboration",
  "human AI collaboration",
  "human-AI team",
  "human AI team",
  "human-AI teaming",
  "human AI teaming",
  "AI collaboration",
  "AI-assisted",
  "AI assisted",
  "human-AI interaction",
  "human AI interaction",
  "human-centered AI",
  "human centred AI",
  "collaborative AI",
  "teaming",
  "human computer",
  "HCI",
  "assistive AI",
  "cooperative AI",
  "mixed-initiative",
  "mixed initiative",
];

function isHumanAICollabRelevant(item) {
  const text = `${item.title || ""} ${item.summary || ""}`.toLowerCase();
  return HUMAN_AI_PHRASES.some((phrase) => text.includes(phrase.toLowerCase()));
}

// ── Normalize graph node to doc + preserve payload ──────────────────────────
function graphNodeToDoc(node) {
  return {
    id: node.id,
    title: node.title,
    summary: node.summary || "",
    source: node.source || "research",
    origin: "graph",
    payload: node,
  };
}

// ── Heuristic design metadata from title + summary (for ingest items) ──
const LEVER_KEYWORDS = {
  workflow: ["workflow", "process", "pipeline", "delegation", "task allocation"],
  role: ["role", "teammate", "agent", "human-in-the-loop", "division of labor"],
  ritual: ["ritual", "onboarding", "meeting", "cadence", "feedback loop"],
  capability_boundary: ["capability", "boundary", "automation", "human oversight"],
  interface: ["interface", "transparency", "explainability", "trust", "calibration"],
  governance: ["governance", "policy", "ethics", "accountability", "fairness"],
};
const INTENT_KEYWORDS = {
  team_structure: ["team", "teaming", "collaboration", "structure"],
  workflow_redesign: ["workflow", "redesign", "process"],
  role_definition: ["role", "delegation", "agent"],
  ritual_design: ["ritual", "onboarding", "feedback"],
  tooling_selection: ["tool", "interface", "system"],
  governance_policy: ["governance", "policy", "ethics"],
  learning_upskilling: ["learning", "training", "upskilling", "skill"],
};

function inferDesignMetadata(title, summary) {
  const text = `${title || ""} ${summary || ""}`.toLowerCase();
  const designLevers = [];
  for (const [lever, keywords] of Object.entries(LEVER_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) designLevers.push(lever);
  }
  const designerIntents = [];
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) designerIntents.push(intent);
  }
  let designQuestion = "";
  if (text.includes("how might") || text.includes("how should") || text.includes("how do ")) {
    const match = text.match(/(how (?:might|should|do|can)[^.?!]+[.?!])/);
    if (match) designQuestion = match[1].trim();
  }
  if (!designQuestion && designLevers.length > 0) {
    designQuestion = `How might design support ${(designLevers[0] || "").replace(/_/g, " ")} in human-AI collaboration?`;
  }
  return { designLevers, designerIntents, designQuestion };
}

// ── Normalize ingest item to doc ──────────────────────────────────────────
function ingestItemToDoc(item) {
  const yearMatch = item.publishedAt && String(item.publishedAt).match(/\d{4}/);
  const inferred = inferDesignMetadata(item.title, item.summary);
  return {
    id: item.id,
    title: item.title,
    summary: item.summary || "",
    source: item.source || "industry",
    origin: "ingest",
    payload: {
      id: item.id,
      title: item.title,
      authors: "Various",
      year: yearMatch ? Number(yearMatch[0]) : new Date().getFullYear(),
      url: item.url || "",
      summary: item.summary || "",
      source: item.source || "industry",
      designLevers: inferred.designLevers,
      designerIntents: inferred.designerIntents,
      designQuestion: inferred.designQuestion,
      tags: item.tags || [],
    },
  };
}

async function main() {
  console.log("Loading research-graph.json and ingest-candidates.json...");
  const graphRaw = await fs.readFile(GRAPH_PATH, "utf-8");
  const graph = JSON.parse(graphRaw);
  let candidates = { items: [] };
  try {
    const candRaw = await fs.readFile(CANDIDATES_PATH, "utf-8");
    candidates = JSON.parse(candRaw);
  } catch (e) {
    console.log("No ingest-candidates.json found; only re-clustering existing nodes.");
  }

  const graphDocs = graph.nodes.map(graphNodeToDoc);
  const rawIngest = candidates.items || [];
  const relevantIngest = rawIngest.filter(isHumanAICollabRelevant);
  if (rawIngest.length > 0 && relevantIngest.length < rawIngest.length) {
    console.log(
      `Filtered ingest to human–AI collaboration relevant: ${relevantIngest.length} of ${rawIngest.length} kept.`
    );
  }
  const ingestDocs = relevantIngest.map(ingestItemToDoc);
  const allDocs = [...graphDocs, ...ingestDocs];
  console.log(`Total documents: ${allDocs.length} (${graphDocs.length} graph + ${ingestDocs.length} ingest)`);

  // Title repeated for ~2× weight — titles are more signal-rich than summaries
  const tokenized = allDocs.map((d) => tokenize(`${d.title} ${d.title} ${d.summary}`));
  const vocab = buildVocabulary(tokenized, maxVocab);
  console.log(`Vocabulary size: ${vocab.length}`);

  const matrix = tfIdfMatrix(tokenized, vocab);
  const k = Math.min(K, allDocs.length, 20);
  console.log(`Running k-means with k=${k}...`);
  const result = kmeans(matrix, k, { maxIterations: 100, seed: 42 });
  let clusterAssignments = result.clusters;

  console.log("Running PCA to 2D...");
  const pca = new PCA(matrix);
  const projected = pca.predict(matrix);
  const n = matrix.length;
  const raw2d = [];
  for (let i = 0; i < n; i++) {
    const row = Array.isArray(projected[i]) ? projected[i] : [projected.get(i, 0), projected.get(i, 1)];
    raw2d.push([row[0], row[1]]);
  }
  const points2d = scaleToViewBox(raw2d);

  const { clusterAssignments: mergedAssignments, k: mergedK } = mergeSmallClusters(
    points2d,
    clusterAssignments
  );
  if (mergedK < k) {
    console.log(`Merged small clusters: ${k} → ${mergedK} (min size ${MIN_CLUSTER_SIZE}).`);
  }

  const clusterLabelResults = topTermsPerCluster(
    tokenized,
    vocab,
    matrix,
    mergedAssignments
  );
  console.log("Cluster labels (from data):", clusterLabelResults.map((r) => r.label));

  const points2dNeat = applyNeatComposition(points2d, mergedAssignments, mergedK);
  console.log("Applied neat composition (inner + outer ring, center filled).");

  const nodesOutRaw = allDocs.map((d, i) => {
    const clusterId = `cluster-${mergedAssignments[i]}`;
    const embedding = points2dNeat[i];
    if (d.origin === "graph") {
      return {
        ...d.payload,
        cluster: clusterId,
        embedding,
      };
    }
    return {
      ...d.payload,
      cluster: clusterId,
      embedding,
    };
  });

  // Deduplicate by id (keep first = prefer graph over ingest when same id)
  const seenIds = new Set();
  const nodesOut = nodesOutRaw.filter((node) => {
    if (seenIds.has(node.id)) return false;
    seenIds.add(node.id);
    return true;
  });
  if (nodesOut.length < nodesOutRaw.length) {
    console.log(`Dropped ${nodesOutRaw.length - nodesOut.length} duplicate node(s) by id.`);
  }

  // Build cluster rationale: sample design questions + design focus (most common lever)
  const leverCountsByCluster = new Map();
  const designQuestionsByCluster = new Map();
  for (const node of nodesOut) {
    const c = node.cluster;
    if (!leverCountsByCluster.has(c)) {
      leverCountsByCluster.set(c, new Map());
      designQuestionsByCluster.set(c, []);
    }
    for (const lever of node.designLevers || []) {
      const m = leverCountsByCluster.get(c);
      m.set(lever, (m.get(lever) || 0) + 1);
    }
    const q = (node.designQuestion || "").trim();
    if (q) {
      const arr = designQuestionsByCluster.get(c);
      if (arr.length < 2) arr.push(q);
    }
  }
  const clustersOut = clusterLabelResults.map((r, i) => {
    const cid = `cluster-${i}`;
    const leverCounts = leverCountsByCluster.get(cid);
    let designFocus = "";
    if (leverCounts && leverCounts.size > 0) {
      const sorted = [...leverCounts.entries()].sort((a, b) => b[1] - a[1]);
      if (sorted[0][1] >= 2) designFocus = sorted[0][0].replace(/_/g, " ");
    }
    const sampleDesignQuestions = designQuestionsByCluster.get(cid) || [];
    let label = r.label;
    // Prepend design focus only if label has fewer than 3 segments (avoid overly long labels)
    const segmentCount = r.label.split(" & ").length;
    if (designFocus && segmentCount < 3 && !r.label.toLowerCase().includes(designFocus.toLowerCase())) {
      label = `${designFocus.charAt(0).toUpperCase() + designFocus.slice(1)} & ${r.label}`;
    }
    return {
      id: cid,
      label,
      topTerms: r.topTerms,
      sampleDesignQuestions,
      designFocus: designFocus || undefined,
    };
  });

  const out = { clusters: clustersOut, nodes: nodesOut };

  if (dryRun) {
    console.log("Dry run: not writing. Cluster sample:", clustersOut.slice(0, 3));
    console.log("Node sample (first):", JSON.stringify(nodesOut[0], null, 2));
    return;
  }

  await fs.writeFile(
    GRAPH_PATH,
    JSON.stringify(out, null, 2),
    "utf-8"
  );
  console.log(`Wrote ${GRAPH_PATH} with ${clustersOut.length} clusters and ${nodesOut.length} nodes.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
