import { Finding, DetectorConfig } from '../types';

/** Detects API_KEY by known prefixes and high-entropy heuristic (Shannon ≥ 3.5). BRIEF §8.1 Layer A. */
export function detectApiKey(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
