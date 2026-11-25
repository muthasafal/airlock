import { Finding, Category, DetectorConfig } from './types';

/** Severity order. Higher index = higher severity. Used by merge for overlap resolution. BRIEF §8.1 Layer C. */
export const CATEGORY_SEVERITY: Category[] = [
  'OTHER_SENSITIVE',
  'DATE_OF_BIRTH',
  'LOCATION',
  'ORG_TERM',
  'INTERNAL_PROJECT',
  'LEGAL_MATTER',
  'HEALTH',
  'FINANCIAL_AMOUNT',
  'PERSON',
  'ORG',
  'EMAIL',
  'PHONE',
  'UPI',
  'IFSC',
  'BANK_ACCOUNT',
  'IP_ADDRESS',
  'URL_SECRET',
  'PAN',
  'GOVERNMENT_ID',
  'AADHAAR',
  'CARD',
  'JWT',
  'API_KEY',
  'PRIVATE_KEY',
  'PASSWORD',
  'CREDENTIAL',
];

/**
 * Merges findings from all detectors applying Layer C rules: union, sort by start,
 * prefer longer on overlap, rules beat Nano for structured types, severity wins.
 * BRIEF §8.1 Layer C.
 */
export function mergeFindings(_findings: Finding[], _config: DetectorConfig): Finding[] {
  throw new Error('not implemented: architecture-skeleton');
}
