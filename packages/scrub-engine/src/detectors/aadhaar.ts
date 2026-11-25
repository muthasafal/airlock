import type { DetectorConfig, Finding } from '../types.js';
import { verhoeffCheck } from '../checksums/verhoeff.js';
import { matchAll } from './util.js';

const AADHAAR = /(?<!\d[\s-]?)[2-9]\d{3}\s?\d{4}\s?\d{4}(?![\s-]?\d)/g;

/** 12-digit Aadhaar numbers that also pass the Verhoeff checksum. BRIEF §8.1 AADHAAR. */
export function detectAadhaar(text: string, _config?: DetectorConfig): Finding[] {
  return matchAll(text, AADHAAR, 'AADHAAR', (v) => verhoeffCheck(v));
}
