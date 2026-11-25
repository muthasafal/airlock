import { Finding, DetectorConfig } from '../types';

/** Detects JWT spans: three base64url segments separated by dots. BRIEF §8.1 Layer A. */
export function detectJwt(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
