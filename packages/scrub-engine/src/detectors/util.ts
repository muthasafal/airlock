import type { Category, Finding } from '../types.js';

/** Builds a rule finding (confidence 1 unless given). */
export function ruleFinding(text: string, start: number, category: Category, confidence = 1): Finding {
  return { start, end: start + text.length, text, category, detector: 'RULE', confidence };
}

/**
 * Runs a regex globally and maps every match (or capture group `group`) to a finding.
 * `accept` may reject a match (false) or set its confidence (a number).
 */
export function matchAll(
  text: string,
  re: RegExp,
  category: Category,
  accept: (value: string, m: RegExpExecArray) => boolean | number = () => true,
  group = 0,
): Finding[] {
  const out: Finding[] = [];
  let flags = re.flags;
  if (!flags.includes('g')) flags += 'g';
  if (!flags.includes('d')) flags += 'd';
  const rx = new RegExp(re.source, flags);
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    if (m[0].length === 0) {
      rx.lastIndex++;
      continue;
    }
    const value = m[group];
    const idx = m.indices?.[group];
    if (value === undefined || !idx) continue;
    const ok = accept(value, m);
    if (ok === false) continue;
    out.push(ruleFinding(value, idx[0], category, typeof ok === 'number' ? ok : 1));
  }
  return out;
}

/** True when one of the keywords appears in the `window` characters before `index`. */
export function keywordBefore(text: string, index: number, keywords: RegExp, window = 30): boolean {
  return keywords.test(text.slice(Math.max(0, index - window), index));
}
