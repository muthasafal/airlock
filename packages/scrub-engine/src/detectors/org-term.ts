import { Finding, DetectorConfig } from '../types';

/** Detects ORG_TERM spans: exact or case-insensitive whole-word matches. BRIEF §8.1 Layer A. */
export function detectOrgTerm(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
