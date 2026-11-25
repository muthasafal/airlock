import { Finding, DetectorConfig } from '../types';

/** Detects IP_ADDRESS spans: IPv4 with octet validation, simplified IPv6. BRIEF §8.1 Layer A. */
export function detectIpAddress(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
