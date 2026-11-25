import { Finding, DetectorConfig } from '../types';

/** Detects AADHAAR spans: regex + Verhoeff checksum validation. BRIEF §8.1 Layer A. */
export function detectAadhaar(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
