This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Paper Ingestion

You can auto-fill missing paper references and optionally download open-access PDFs.

```bash
npm run ingest:papers -- --dry-run
npm run ingest:papers
```

Notes:
- Uses Semantic Scholar search to resolve titles.
- Downloads open-access PDFs into `public/papers` when available.
- Sets `citation` and `url` for missing entries in `src/data/research-graph.json`.
- Provide `SEMANTIC_SCHOLAR_API_KEY` for higher rate limits if needed.
- Writes feed candidates to `src/data/ingest-candidates.json`.
- Customize feeds with `ACM_FEED_URL`, `ANTHROPIC_FEED_URL`, `META_FEED_URL`, `MANUS_FEED_URL`, `DEEPSEEK_FEED_URL`, or `EXTRA_FEEDS` (comma-separated).
- Limit feed items per source with `--feed-limit=50`.
- Anthropic falls back to parsing the Newsroom page if no RSS works.

## Merge graph (data-driven clusters)

To merge ingest candidates into the radar and recompute **real clusters from the data** (no fixed dummy cluster names):

```bash
npm install
npm run merge:graph -- --dry-run   # preview only
npm run merge:graph                # overwrites src/data/research-graph.json
```

What it does:
- Loads `research-graph.json` and `ingest-candidates.json`.
- Builds TF-IDF from title + summary for all items, runs **k-means** clustering, then **PCA** to 2D for the layout.
- **Cluster labels** are derived from the top terms in each cluster (e.g. "Trust & Teams & Transparency").
- Writes a new `research-graph.json` with updated `clusters` and `nodes` (existing + ingest). All nodes get new `cluster` ids (`cluster-0`, `cluster-1`, …) and new 2D `embedding` coordinates.

Options:
- `--k=10` — number of clusters (default 10).
- `--dry-run` — print cluster labels and a sample node; do not write the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
