import { Finding } from '@airlock/scrub-engine';

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
export function resolveSpans(_findings: NanoFinding[], _source: string): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
