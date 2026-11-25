import type { RestoreResult, SessionMapping, StreamingRestoreBuffer } from './types.js';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface Matcher {
  re: RegExp | null;
  exact: Map<string, string>;
  lower: Map<string, string>;
  maxLen: number;
}

/** Builds the reverse lookup (stand-in → original, plus aliases) and one combined, longest-first regex. */
function buildMatcher(mapping: SessionMapping): Matcher {
  const exact = new Map<string, string>();
  const lower = new Map<string, string>();
  for (const [standIn, original] of mapping.reverse) {
    exact.set(standIn, original);
    if (!lower.has(standIn.toLowerCase())) lower.set(standIn.toLowerCase(), original);
  }
  for (const [standIn, original] of mapping.aliases) {
    if (!exact.has(standIn)) exact.set(standIn, original);
    if (!lower.has(standIn.toLowerCase())) lower.set(standIn.toLowerCase(), original);
  }
  const keys = [...lower.keys()].filter((k) => k.length > 0).sort((a, b) => b.length - a.length);
  const maxLen = keys.reduce((m, k) => Math.max(m, k.length), 0);
  if (keys.length === 0) return { re: null, exact, lower, maxLen };
  // Word-boundary aware (letters, digits, underscore); a trailing "s'" possessive is allowed.
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}_])(?:${keys.map(escape).join('|')})(?=s'|[^\\p{L}\\p{N}_]|$)`,
    'giu',
  );
  return { re, exact, lower, maxLen };
}

/** Picks the original for a matched stand-in, carrying over UPPER / lower case where the match used it. */
function originalFor(match: string, m: Matcher): string {
  const hit = m.exact.get(match);
  if (hit !== undefined) return hit;
  const original = m.lower.get(match.toLowerCase()) ?? match;
  const letters = match.replace(/[^\p{L}]/gu, '');
  if (letters.length > 1 && letters === letters.toUpperCase()) return original.toUpperCase();
  if (letters.length > 1 && letters === letters.toLowerCase()) return original.toLowerCase();
  return original;
}

function restoreWith(text: string, m: Matcher): RestoreResult {
  if (!m.re || !text) return { text, restoredSpans: [] };
  const spans: RestoreResult['restoredSpans'] = [];
  let out = '';
  let last = 0;
  for (const match of text.matchAll(m.re)) {
    const idx = match.index ?? 0;
    const original = originalFor(match[0], m);
    out += text.slice(last, idx);
    spans.push({ start: out.length, end: out.length + original.length, standIn: match[0], original });
    out += original;
    last = idx + match[0].length;
  }
  out += text.slice(last);
  return { text: out, restoredSpans: spans };
}

/**
 * Restores stand-ins to originals in a model answer. Handles:
 * - case variants (Maya → maya, MAYA)
 * - possessives (Maya's → Priya's, Iyers' → Shahs')
 * - first-name/surname aliases
 * - titles ("Ms. Iyer" → "Ms. Shah")
 * Generalised phrases are not reversible and are left as they are. BRIEF §8.5.
 */
export function restore(text: string, mapping: SessionMapping): RestoreResult {
  return restoreWith(text, buildMatcher(mapping));
}

/**
 * Creates a streaming restore buffer. It holds back a tail of at least maxStandInLength
 * characters and only cuts at whitespace that no stand-in match spans, so restoring chunk by
 * chunk always equals restoring the whole string (BRIEF §8.5, §8.6 invariant 9).
 */
export function createStreamingRestoreBuffer(
  mapping: SessionMapping,
  maxStandInLength = 0,
): StreamingRestoreBuffer {
  const matcher = buildMatcher(mapping);
  const hold = Math.max(maxStandInLength, matcher.maxLen) + 2;
  let pending = '';

  const safeCut = (): number => {
    let cut = pending.length - hold;
    if (cut <= 0) return 0;
    const spans: Array<[number, number]> = [];
    if (matcher.re) for (const m of pending.matchAll(matcher.re)) spans.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
    while (cut > 0) {
      const inside = spans.find(([s, e]) => s < cut && cut < e);
      if (inside) {
        cut = inside[0];
        continue;
      }
      if (/\s/.test(pending[cut] ?? '')) return cut;
      cut--;
    }
    return 0;
  };

  return {
    push(chunk: string): string {
      pending += chunk;
      const cut = safeCut();
      if (cut <= 0) return '';
      const head = pending.slice(0, cut);
      pending = pending.slice(cut);
      return restoreWith(head, matcher).text;
    },
    flush(): string {
      const rest = restoreWith(pending, matcher).text;
      pending = '';
      return rest;
    },
  };
}
