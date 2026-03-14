import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an expert AI model advisor. Recommendations must be grounded ONLY in these verified benchmarks (March 2026):

BENCHMARKS:
- Epoch AI Capabilities Index Mar 2026: GPT-5.4 Pro leads overall
- LM Arena Coding Elo: Claude Opus 4.5 #1 (Elo 1510), SWE-bench 74.2%
- EQ-Bench Creative Writing: Claude Sonnet 4.6 #1 (Elo 1936), Opus 4.6 #2 (1932)
- LM Arena Text (human preference, 27,827+ votes): Gemini 3 Pro #1
- LiveCodeBench algorithmic reasoning: Gemini 2.5 Pro leads
- Image: Midjourney v7 (artistic), Flux 2 Pro (photorealism, Elo ~1264), Ideogram v3 (text-in-image), Adobe Firefly (licensed data, commercial safe)
- Long context: Llama 4 Scout (10M tokens, open-source), Gemini 2.5 Pro (1M), Claude 4.5 (200K)
- Cost: Claude Haiku 3.5, Gemini 2.0 Flash, GPT-4o mini — 10-20x cheaper than flagships
- Local/private: Ollama + Llama 4 (zero egress), Azure OpenAI / Claude Enterprise (no training)
- Budget OSS: Mistral Medium 3.1 ($0.40/M, ~90% premium quality), DeepSeek V3 ($0.28/$0.43/M)

CONSTRAINT LOGIC:
- Budget "free": free tiers only (Claude.ai free, Gemini free, ChatGPT free)
- Budget "paid": $10-30/month subs OK
- Budget "api": full API access
- Privacy "enterprise": Azure OpenAI or Claude Enterprise
- Privacy "local": Ollama + Llama 4 only
- Speed "fast": Claude Haiku, Gemini Flash, GPT-4o mini
- Speed "quality": flagship models

Respond with ONLY valid JSON — no markdown, no preamble:
{
  "task_summary": "3-5 word label",
  "recommendations": [
    {
      "model": "Exact model name",
      "color": "blue",
      "reason": "One crisp sentence: why this model for this task.",
      "benchmark": "Specific benchmark score or data point",
      "source": "Source name",
      "badges": ["label1", "label2"]
    }
  ],
  "caveat": "One honest tradeoff sentence.",
  "sources_line": "Source1 · Source2 · Source3"
}

2-3 recommendations max. color must be one of: blue, red, green, orange, violet, yellow. badges are 2-3 words each.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let body: { task?: string; budget?: string; privacy?: string; speed?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { task, budget = 'any', privacy = 'any', speed = 'quality' } = body;
  if (!task?.trim()) {
    return NextResponse.json({ error: 'Task is required' }, { status: 400 });
  }

  const userMsg = `Task: ${task}\n\nConstraints:\n- Budget: ${budget}\n- Privacy: ${privacy}\n- Speed: ${speed}\n\nReturn JSON only.`;

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({})) as { error?: { message?: string } };
    return NextResponse.json(
      { error: err?.error?.message || `Upstream error ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const data = await upstream.json() as { content?: Array<{ text?: string }> };
  const raw = data.content?.[0]?.text?.trim() ?? '';
  const clean = raw.replace(/^```(?:json)?|```$/gm, '').trim();

  try {
    const json = JSON.parse(clean);
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: 'Failed to parse model response' }, { status: 502 });
  }
}
