/**
 * Move B — Field Guide Data Enrichment
 * ─────────────────────────────────────────────────────────────────────────────
 * Enriches research-graph.json with isometric city "field guide" data for each
 * paper node using the Gemini API.
 *
 * Usage:
 *   GEMINI_API_KEY=AIza... node scripts/generate-field-guide.mjs
 *
 * Reads:  src/data/research-graph.json
 * Writes: src/data/research-graph.enriched.json  (original file untouched)
 *
 * Resumable: nodes that already have a `fieldGuide` property are skipped.
 * Safe to re-run after a crash — progress is saved after each batch.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRAPH_PATH = join(__dirname, "../src/data/research-graph.json");
const OUTPUT_PATH = join(__dirname, "../src/data/research-graph.enriched.json");

/* ── Config ────────────────────────────────────────────────────────────────── */

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌  GEMINI_API_KEY environment variable is not set.");
  console.error(
    "    Add it to .env.local and re-run:  source .env.local && node scripts/generate-field-guide.mjs"
  );
  process.exit(1);
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

/** How many papers to process in parallel (stay under Gemini free-tier 10 req/s) */
const BATCH_SIZE = 5;
/** Delay between batches in ms */
const BATCH_DELAY_MS = 1200;
/** Timeout per request in ms */
const REQUEST_TIMEOUT_MS = 20_000;

/* ── System prompt ─────────────────────────────────────────────────────────── */

const SYSTEM_INSTRUCTION = `
You are a "Field Guide" writer for an interactive isometric city map that visualises
research on Human-AI Collaboration. Each building in the city represents a paper.
Your job is to generate four short artefacts that make each paper tangible and
actionable for a design team exploring the city.

Voice: warm, concrete, second-person ("you"), like a knowledgeable guide handing
you a postcard at each stop. No jargon without explanation. No hedging.

Output ONLY a valid JSON object — no markdown fences, no explanation outside the object.
`.trim();

/* ── Per-node prompt template ──────────────────────────────────────────────── */

function buildPrompt(node) {
  return `
Given this research paper:

Title: ${node.title}
Authors: ${node.authors} (${node.year})
Summary: ${node.summary}
Design question it addresses: ${node.designQuestion ?? "not specified"}
Tags: ${(node.tags ?? []).join(", ")}

Generate ONLY this JSON object (no markdown, raw JSON):
{
  "landmarkName": "An evocative 3-6 word name for this paper's building in the city, e.g. 'The Calibration Spire' or 'Council of Handoffs'. Should feel like a place, not a title.",
  "fieldNote": "Two sentences in second-person ('you') describing the single most actionable design insight from this paper. Be concrete — what should the designer actually do or watch out for?",
  "ritualRecipe": "One 5-minute team activity that brings this paper's finding to life. Name it, describe the setup (≤2 sentences), then the activity steps (≤3 bullet points: • step). Keep it practical.",
  "figmaSnippet": "A short sticky-note style annotation for a Figma board. Format: **[Finding]**: one sentence insight. **[Try]**: one concrete design action. Max 40 words total."
}
`.trim();
}

/* ── Gemini API call ───────────────────────────────────────────────────────── */

async function callGemini(node) {
  const body = {
    system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ parts: [{ text: buildPrompt(node) }] }],
    generationConfig: {
      maxOutputTokens: 600,
      temperature: 0.75,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip potential markdown fences
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/* ── Progress helpers ──────────────────────────────────────────────────────── */

function loadGraph() {
  const raw = readFileSync(GRAPH_PATH, "utf8");
  return JSON.parse(raw);
}

function loadOutput() {
  if (existsSync(OUTPUT_PATH)) {
    const raw = readFileSync(OUTPUT_PATH, "utf8");
    return JSON.parse(raw);
  }
  // Start from the source graph
  return loadGraph();
}

function saveOutput(graph) {
  writeFileSync(OUTPUT_PATH, JSON.stringify(graph, null, 2), "utf8");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ── Main ──────────────────────────────────────────────────────────────────── */

async function main() {
  console.log("📖  Loading graph…");
  const graph = loadOutput();
  const nodes = graph.nodes;

  const todo = nodes.filter((n) => !n.fieldGuide);
  const alreadyDone = nodes.length - todo.length;

  console.log(
    `✅  ${alreadyDone} nodes already enriched — ${todo.length} remaining`
  );

  if (todo.length === 0) {
    console.log("🎉  All nodes already have field guides. Nothing to do.");
    return;
  }

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (node) => {
        try {
          const fieldGuide = await callGemini(node);
          // Write result back into the graph nodes array (find by id)
          const graphNode = nodes.find((n) => n.id === node.id);
          if (graphNode) graphNode.fieldGuide = fieldGuide;
          return { id: node.id, ok: true };
        } catch (err) {
          return { id: node.id, ok: false, err: err.message };
        }
      })
    );

    for (const r of results) {
      const val = r.value ?? r.reason;
      if (val?.ok) {
        processed++;
        console.log(`  ✓ [${processed + alreadyDone}/${nodes.length}] ${val.id}`);
      } else {
        errors++;
        console.warn(`  ✗ ${val?.id ?? "unknown"}: ${val?.err ?? r.reason}`);
      }
    }

    // Save progress after every batch so a crash doesn't lose work
    saveOutput(graph);

    if (i + BATCH_SIZE < todo.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log("\n─────────────────────────────────────────────");
  console.log(`📦  Done. ${processed} enriched, ${errors} failed.`);
  console.log(`💾  Output written to: ${OUTPUT_PATH}`);

  if (errors > 0) {
    console.log("⚠️   Re-run the script to retry failed nodes.");
  } else {
    console.log(
      "\n👉  Next step: copy enriched data over the source file if satisfied:\n" +
        "    cp src/data/research-graph.enriched.json src/data/research-graph.json"
    );
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
