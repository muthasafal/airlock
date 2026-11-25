import { Finding, DetectorConfig } from '../types';

/** Detects IFSC spans: regex format validation. BRIEF §8.1 Layer A. */
export function detectIfsc(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
