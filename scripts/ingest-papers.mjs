import fs from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const GRAPH_PATH = path.resolve("src/data/research-graph.json");
const PAPERS_DIR = path.resolve("public/papers");
const CANDIDATES_PATH = path.resolve("src/data/ingest-candidates.json");

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");
const skipFeeds = args.has("--skip-feeds");
const limitArg = [...args].find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : Infinity;
const feedLimitArg = [...args].find((arg) => arg.startsWith("--feed-limit="));
const feedLimit = feedLimitArg ? Number.parseInt(feedLimitArg.split("=")[1], 10) : 50;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Keep only items relevant to human–AI collaboration (same logic as merge-graph)
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

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const buildCitation = (paper) => {
  const authors = paper.authors || [];
  let authorText = "Unknown";
  if (authors.length === 1) authorText = authors[0].name;
  else if (authors.length === 2) authorText = `${authors[0].name} and ${authors[1].name}`;
  else if (authors.length > 2) authorText = `${authors[0].name} et al.`;
  const year = paper.year || "n.d.";
  const venue = paper.venue ? ` ${paper.venue}.` : "";
  return `${authorText} (${year}). ${paper.title}.${venue}`;
};

const fetchPaper = async (title, attempt = 0) => {
  const base = "https://api.semanticscholar.org/graph/v1/paper/search";
  const fields = [
    "title",
    "authors",
    "year",
    "venue",
    "externalIds",
    "openAccessPdf",
    "url",
  ].join(",");
  const url = `${base}?query=${encodeURIComponent(title)}&limit=1&fields=${fields}`;
  const headers = {};
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
    headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  }
  const res = await fetch(url, { headers });
  if (res.status === 429 && attempt < 3) {
    const backoff = 1500 * (attempt + 1);
    await sleep(backoff);
    return fetchPaper(title, attempt + 1);
  }
  if (!res.ok) throw new Error(`Semantic Scholar error ${res.status}`);
  const payload = await res.json();
  return payload?.data?.[0] || null;
};

const downloadPdf = async (pdfUrl, filename) => {
  const target = path.join(PAPERS_DIR, filename);
  try {
    await fs.access(target);
    return target;
  } catch {
    // continue
  }
  const res = await fetch(pdfUrl);
  if (!res.ok) throw new Error(`PDF download error ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  await fs.writeFile(target, Buffer.from(arrayBuffer));
  return target;
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
});

const ensureArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const feedSources = () => {
  const sources = [
    {
      id: "openai",
      label: "OpenAI Blog",
      url: "https://openai.com/blog/rss.xml",
      source: "industry",
      tags: ["openai", "industry"],
    },
    {
      id: "anthropic",
      label: "Anthropic Blog",
      htmlUrl: "https://www.anthropic.com/news",
      urls: process.env.ANTHROPIC_FEED_URL
        ? [process.env.ANTHROPIC_FEED_URL]
        : [
            "https://anthropic.com/news/feed_anthropic.xml",
            "https://www.anthropic.com/news/feed_anthropic.xml",
            "https://anthropic.com/blog/rss.xml",
            "https://www.anthropic.com/blog/rss.xml",
          ],
      source: "industry",
      tags: ["anthropic", "industry"],
    },
    {
      id: "google-ai",
      label: "Google AI Blog",
      urls: [
        "https://blog.google/technology/ai/rss/",
        "http://googleaiblog.blogspot.com/atom.xml",
      ],
      source: "industry",
      tags: ["google", "industry"],
    },
    {
      id: "aifeed",
      label: "AI Feed",
      urls: ["https://aifeed.dev/feed.xml"],
      source: "industry",
      tags: ["aifeed", "industry"],
    },
    {
      id: "microsoft-research",
      label: "Microsoft Research Blog",
      url: "https://www.microsoft.com/en-us/research/feed/",
      source: "industry",
      tags: ["microsoft", "industry"],
    },
    {
      id: "meta-ai",
      label: "Meta AI Blog",
      htmlUrl: "https://ai.meta.com/blog/",
      urls: process.env.META_FEED_URL
        ? [process.env.META_FEED_URL]
        : [
            "https://research.facebook.com/feed/",
            "https://ai.meta.com/blog/rss",
            "https://ai.meta.com/blog/rss/",
            "https://ai.facebook.com/blog/rss",
            "https://ai.facebook.com/blog/rss/",
          ],
      source: "industry",
      tags: ["meta", "industry"],
    },
    {
      id: "manus",
      label: "Manus.ai",
      urls: process.env.MANUS_FEED_URL ? [process.env.MANUS_FEED_URL] : [],
      source: "industry",
      tags: ["manus", "industry"],
    },
    {
      id: "deepseek",
      label: "DeepSeek",
      urls: process.env.DEEPSEEK_FEED_URL ? [process.env.DEEPSEEK_FEED_URL] : [],
      source: "industry",
      tags: ["deepseek", "industry"],
    },
    {
      id: "arxiv-hat",
      label: "arXiv: human-AI teaming",
      url: "http://export.arxiv.org/api/query?search_query=all:human%20AI%20teaming&start=0&max_results=20",
      source: "research",
      tags: ["arxiv", "research"],
    },
    {
      id: "arxiv-human-ai-teams",
      label: "arXiv: human AI teams",
      url: "http://export.arxiv.org/api/query?search_query=all:human%20AI%20teams&start=0&max_results=20",
      source: "research",
      tags: ["arxiv", "research"],
    },
    {
      id: "arxiv-cs-cl",
      label: "arXiv: cs.CL",
      url: "https://arxiv.org/rss/cs.CL",
      source: "research",
      tags: ["arxiv", "research"],
    },
    {
      id: "arxiv-cs-lg",
      label: "arXiv: cs.LG",
      url: "https://arxiv.org/rss/cs.LG",
      source: "research",
      tags: ["arxiv", "research"],
    },
  ];

  if (process.env.ACM_FEED_URL) {
    sources.push({
      id: "acm",
      label: "ACM Digital Library",
      url: process.env.ACM_FEED_URL,
      source: "research",
      tags: ["acm", "research"],
    });
  }

  if (process.env.EXTRA_FEEDS) {
    const extra = process.env.EXTRA_FEEDS.split(",").map((value) => value.trim());
    for (const entry of extra) {
      if (!entry) continue;
      sources.push({
        id: `extra-${slugify(entry)}`,
        label: entry,
        url: entry,
        source: "industry",
        tags: ["extra"],
      });
    }
  }

  return sources;
};

const parseRss = (xmlText) => {
  const parsed = xmlParser.parse(xmlText);
  const channel = parsed?.rss?.channel;
  if (!channel) return [];
  const items = ensureArray(channel.item);
  return items.map((item) => ({
    title: item.title?.text || item.title || "",
    url: item.link?.text || item.link || "",
    summary: item.description?.text || item.description || "",
    date: item.pubDate?.text || item.pubDate || "",
  }));
};

const parseAtom = (xmlText) => {
  const parsed = xmlParser.parse(xmlText);
  const feed = parsed?.feed;
  if (!feed) return [];
  const entries = ensureArray(feed.entry);
  return entries.map((entry) => ({
    title: entry.title?.text || entry.title || "",
    url:
      ensureArray(entry.link)
        .map((link) => link.href)
        .find(Boolean) || "",
    summary: entry.summary?.text || entry.summary || "",
    date: entry.published?.text || entry.published || entry.updated?.text || entry.updated || "",
  }));
};

const stripTags = (value) =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseAnthropicNewsPage = (htmlText) => {
  const items = [];
  const regex =
    /<a[^>]+href="(https?:\/\/[^"]*anthropic\.com\/news\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of htmlText.matchAll(regex)) {
    const url = match[1];
    const raw = stripTags(match[2]);
    if (!raw || raw.length < 8) continue;
    if (raw.toLowerCase().includes("press kit")) continue;
    items.push({
      title: raw,
      url,
      summary: "",
      date: "",
    });
  }
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
};

const parseMetaBlogPage = (htmlText) => {
  const items = [];
  const regex =
    /<a[^>]+href="(https?:\/\/[^"]*ai\.meta\.com\/blog\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of htmlText.matchAll(regex)) {
    const url = match[1];
    const raw = stripTags(match[2]);
    if (!raw || raw.length < 8) continue;
    if (raw.toLowerCase().includes("newsletter")) continue;
    items.push({
      title: raw,
      url,
      summary: "",
      date: "",
    });
  }
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
};

const fetchFeed = async (source, attempt = 0) => {
  const urls = source.urls || [source.url];
  let lastError = null;

  for (const url of urls) {
    const res = await fetch(url);
    if (res.status === 404) {
      lastError = new Error(`Feed error 404`);
      continue;
    }
    if (res.status === 429 && attempt < 2) {
      const backoff = 1200 * (attempt + 1);
      await sleep(backoff);
      return fetchFeed({ ...source, url }, attempt + 1);
    }
    if (!res.ok) {
      lastError = new Error(`Feed error ${res.status}`);
      continue;
    }
    const text = await res.text();
    const isAtom = text.includes("<feed") && text.includes("http://www.w3.org/2005/Atom");
    const items = isAtom ? parseAtom(text) : parseRss(text);
    return items
      .filter((item) => item.title)
      .slice(0, feedLimit)
      .map((item) => ({
        id: `${source.id}-${slugify(item.title)}`,
        title: item.title,
        url: item.url,
        summary: item.summary,
        publishedAt: item.date,
        source: source.source,
        tags: source.tags,
        feed: source.label,
      }));
  }

  if (source.htmlUrl) {
    const res = await fetch(source.htmlUrl);
    if (res.ok) {
      const htmlText = await res.text();
      const parsedItems =
        source.id === "anthropic"
          ? parseAnthropicNewsPage(htmlText)
          : source.id === "meta-ai"
            ? parseMetaBlogPage(htmlText)
            : [];
      return parsedItems
        .filter((item) => item.title)
        .slice(0, feedLimit)
        .map((item) => ({
          id: `${source.id}-${slugify(item.title)}`,
          title: item.title,
          url: item.url,
          summary: item.summary,
          publishedAt: item.date,
          source: source.source,
          tags: source.tags,
          feed: source.label,
        }));
    }
  }

  throw lastError || new Error("Feed error");
};

const run = async () => {
  const raw = await fs.readFile(GRAPH_PATH, "utf8");
  const data = JSON.parse(raw);
  await fs.mkdir(PAPERS_DIR, { recursive: true });

  const missing = data.nodes.filter((node) => !node.url);
  let processed = 0;
  let updated = 0;

  for (const node of missing) {
    if (processed >= limit) break;
    processed += 1;
    try {
      const paper = await fetchPaper(node.title);
      if (!paper) {
        console.log(`No match: ${node.title}`);
        continue;
      }

      const citation = buildCitation(paper);
      const pdfUrl = paper.openAccessPdf?.url;

      if (pdfUrl) {
        const filename = `${slugify(node.title)}.pdf`;
        try {
          if (!isDryRun) {
            await downloadPdf(pdfUrl, filename);
          }
          node.url = `/papers/${encodeURIComponent(filename)}`;
        } catch (err) {
          if (paper.url) node.url = paper.url;
          console.warn(`PDF unavailable for ${node.title} (${err.message})`);
        }
      } else if (paper.url) {
        node.url = paper.url;
      }

      node.citation = citation;
      updated += 1;
      console.log(`Updated: ${node.title}`);

      if (!isDryRun) {
        await sleep(1100);
      }
    } catch (err) {
      console.warn(`Failed: ${node.title} (${err.message})`);
    }
  }

  if (!isDryRun) {
    await fs.writeFile(GRAPH_PATH, JSON.stringify(data, null, 2));
  }

  if (!skipFeeds) {
    const sources = feedSources();
    const candidates = [];
    for (const source of sources) {
      try {
        const items = await fetchFeed(source);
        const relevant = items.filter(isHumanAICollabRelevant);
        candidates.push(...relevant);
        if (items.length > 0 && relevant.length < items.length) {
          console.log(`Feed ${source.label}: ${relevant.length}/${items.length} (human–AI relevant)`);
        } else {
          console.log(`Feed ${source.label}: ${items.length} items`);
        }
        if (!isDryRun) {
          await sleep(700);
        }
      } catch (err) {
        console.warn(`Feed failed: ${source.label} (${err.message})`);
      }
    }

    if (!isDryRun) {
      await fs.writeFile(CANDIDATES_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), items: candidates }, null, 2));
    }
  }

  console.log(`Processed ${processed} items, updated ${updated}.`);
};

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
