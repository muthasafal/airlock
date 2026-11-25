import { Finding, DetectorConfig } from '../types';

/** Detects PASSWORD spans: password/pwd/pin := value pattern. BRIEF §8.1 Layer A. */
export function detectPassword(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
