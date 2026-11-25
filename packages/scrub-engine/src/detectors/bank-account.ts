import { Finding, DetectorConfig } from '../types';

/** Detects BANK_ACCOUNT spans: 9–18 digits near account keywords. BRIEF §8.1 Layer A. */
export function detectBankAccount(_text: string, _config?: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
