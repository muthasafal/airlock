import type { Detector, Finding } from '@airlock/scrub-engine';

/**
 * Optional on-device detector for names and context (integrations R2). Node has no Gemini
 * Nano, so the CLI can ask a local model served by Ollama, on the loopback interface only.
 * Uses the BRIEF §8.1 JSON schema and span resolution (exact, then case-insensitive, all
 * occurrences; hallucinated spans dropped).
 */

const CATEGORIES = [
  'PERSON', 'ORG', 'LOCATION', 'HEALTH', 'FINANCIAL_AMOUNT', 'LEGAL_MATTER',
  'INTERNAL_PROJECT', 'CREDENTIAL', 'GOVERNMENT_ID', 'DATE_OF_BIRTH', 'OTHER_SENSITIVE',
] as const;

const SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          category: { type: 'string', enum: [...CATEGORIES] },
          confidence: { type: 'number' },
        },
        required: ['text', 'category', 'confidence'],
      },
    },
  },
  required: ['findings'],
};

const SYSTEM =
  'You are a privacy filter. List every span that identifies a person, organisation, private place, health condition, ' +
  'money amount tied to a person or company, legal matter, internal project or credential. Copy each span exactly as written. Do not explain.';

/** Parses "ollama:llama3.2" (optionally "ollama:llama3.2@http://127.0.0.1:11434"). */
export function parseLocalModel(spec: string): { model: string; baseUrl: string } {
  const m = spec.match(/^ollama:([^@]+)(?:@(.+))?$/);
  if (!m) throw new Error('Use --local-model ollama:<model>, for example ollama:llama3.2');
  const baseUrl = (m[2] ?? 'http://127.0.0.1:11434').replace(/\/$/, '');
  const host = new URL(baseUrl).hostname;
  if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(host)) {
    throw new Error('The local model must run on this machine (127.0.0.1). Airlock never sends raw text elsewhere.');
  }
  return { model: m[1], baseUrl };
}

function resolve(text: string, items: Array<{ text: string; category: string; confidence: number }>): Finding[] {
  const out: Finding[] = [];
  const lower = text.toLowerCase();
  for (const it of items) {
    const needle = it.text?.trim();
    if (!needle || needle.length < 2 || !CATEGORIES.includes(it.category as (typeof CATEGORIES)[number])) continue;
    const conf = typeof it.confidence === 'number' && it.confidence >= 0 && it.confidence <= 1 ? it.confidence : 0.6;
    let positions = indexes(text, needle);
    if (positions.length === 0) positions = indexes(lower, needle.toLowerCase());
    for (const at of positions) {
      out.push({ start: at, end: at + needle.length, text: text.slice(at, at + needle.length), category: it.category as Finding['category'], detector: 'NANO', confidence: conf });
    }
  }
  return out;
}

function indexes(h: string, n: string): number[] {
  const r: number[] = [];
  for (let at = h.indexOf(n); at >= 0; at = h.indexOf(n, at + n.length)) r.push(at);
  return r;
}

/** A scrub-engine Detector backed by a local Ollama model. Throws on failure (scrub() then counts it as failed). */
export function localModelDetector(spec: string, timeoutMs = 60000): Detector {
  const { model, baseUrl } = parseLocalModel(spec);
  return {
    async detect(text) {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          model,
          stream: false,
          format: SCHEMA,
          options: { temperature: 0 },
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: text.slice(0, 20000) },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Local model returned ${res.status}`);
      const body = (await res.json()) as { message?: { content?: string } };
      const parsed = JSON.parse(body.message?.content ?? '{}') as { findings?: Array<{ text: string; category: string; confidence: number }> };
      return resolve(text, Array.isArray(parsed.findings) ? parsed.findings : []);
    },
  };
}
