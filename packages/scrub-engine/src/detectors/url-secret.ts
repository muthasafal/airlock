import { Finding, DetectorConfig } from '../types';

/** Detects URL_SECRET spans: URLs with token/key/sig/auth/password in query string. BRIEF §8.1 Layer A. */
export function detectUrlSecret(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
