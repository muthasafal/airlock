import { Finding, DetectorConfig } from '../types';

/** Detects EMAIL spans using RFC-lite regex. BRIEF §8.1 Layer A. */
export function detectEmail(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
