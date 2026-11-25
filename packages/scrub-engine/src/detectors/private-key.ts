import { Finding, DetectorConfig } from '../types';

/** Detects PRIVATE_KEY spans: PEM format BEGIN/END markers. BRIEF §8.1 Layer A. */
export function detectPrivateKey(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
