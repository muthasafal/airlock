import { Finding, DetectorConfig } from '../types';

/** Detects UPI spans: regex format, not matching EMAIL TLDs. BRIEF §8.1 Layer A. */
export function detectUpi(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
