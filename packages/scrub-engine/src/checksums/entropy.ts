/**
 * Shannon entropy for high-entropy secret detection. BRIEF §8.1 API_KEY.
 */

/** Shannon entropy of the string in bits per character (0 for empty input). */
export function shannonEntropy(s: string): number {
  if (!s) return 0;
  const chars = [...s];
  const counts = new Map<string, number>();
  for (const ch of chars) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let h = 0;
  for (const c of counts.values()) {
    const p = c / chars.length;
    h -= p * Math.log2(p);
  }
  return h;
}
