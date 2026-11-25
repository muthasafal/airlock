import type { DetectorConfig, Finding } from '../types.js';
import { matchAll } from './util.js';

const IFSC = /\b[A-Z]{4}0[A-Z0-9]{6}\b/g;

/** Indian bank IFSC codes (4 letters, a zero, 6 alphanumerics). BRIEF §8.1 IFSC. */
export function detectIfsc(text: string, _config?: DetectorConfig): Finding[] {
  return matchAll(text, IFSC, 'IFSC');
}
