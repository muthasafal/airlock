import { Finding, DetectorConfig } from '../types';

/** Detects PAN spans: regex with optional PCHABGJLFT 4th-char check. BRIEF §8.1 Layer A. */
export function detectPan(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
