import type { DetectorConfig, Finding } from '../types.js';
import { ruleFinding } from './util.js';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Whole-word, case-insensitive matches of the org's protected terms, combined into one regex
 * (longest terms first). Each finding takes the category set for its term. BRIEF §8.1 ORG_TERM.
 */
export function detectOrgTerm(text: string, config?: DetectorConfig): Finding[] {
  const terms = (config?.protectedTerms ?? []).filter((t) => t.term.trim().length > 0);
  if (terms.length === 0) return [];
  const byLower = new Map(terms.map((t) => [t.term.trim().toLowerCase(), t.category]));
  const alts = [...byLower.keys()].sort((a, b) => b.length - a.length).map(escape);
  const re = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${alts.join('|')})(?![\\p{L}\\p{N}_])`, 'giu');
  const out: Finding[] = [];
  for (const m of text.matchAll(re)) {
    out.push(ruleFinding(m[0], m.index ?? 0, byLower.get(m[0].toLowerCase()) ?? 'ORG_TERM'));
  }
  return out;
}
