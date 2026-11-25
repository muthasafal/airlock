import { Finding, DetectorConfig } from '../types';

/** Detects PHONE spans: Indian mobile and international formats. BRIEF §8.1 Layer A. */
export function detectPhone(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
