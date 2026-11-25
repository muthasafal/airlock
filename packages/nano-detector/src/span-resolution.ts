import type { Category, Finding } from '@airlock/scrub-engine';

export interface NanoFinding {
  text: string;
  category: string;
  confidence: number;
}

/**
 * Resolves Nano text spans to source offsets.
 * Exact match first, then case-insensitive. Drops hallucinated spans.
 * Expands to all occurrences. BRIEF §8.1 Layer B.
 */
export function resolveSpans(findings: NanoFinding[], source: string, offset = 0): Finding[] {
  const out: Finding[] = [];
  const lowerSource = source.toLowerCase();
  for (const f of findings) {
    const needle = f.text.trim();
    if (needle.length < 2) continue;
    let positions = allIndexes(source, needle);
    if (positions.length === 0) positions = allIndexes(lowerSource, needle.toLowerCase());
    for (const at of positions) {
      out.push({
        start: offset + at,
        end: offset + at + needle.length,
        text: source.slice(at, at + needle.length),
        category: f.category as Category,
        detector: 'NANO',
        confidence: f.confidence,
      });
    }
  }
  return out;
}

function allIndexes(haystack: string, needle: string): number[] {
  const out: number[] = [];
  let from = 0;
  let at: number;
  while ((at = haystack.indexOf(needle, from)) >= 0) {
    out.push(at);
    from = at + needle.length;
  }
  return out;
}
