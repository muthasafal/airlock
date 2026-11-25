import { Finding, DetectorConfig } from '../types';

/** Detects CARD spans: 13–19 digits with optional separators + Luhn validation. BRIEF §8.1 Layer A. */
export function detectCard(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
