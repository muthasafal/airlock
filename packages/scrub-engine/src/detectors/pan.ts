import type { DetectorConfig, Finding } from '../types.js';
import { matchAll } from './util.js';

const PAN = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;

/** PAN numbers; a 4th character in PCHABGJLFT (holder type) gives full confidence. BRIEF §8.1 PAN. */
export function detectPan(text: string, _config?: DetectorConfig): Finding[] {
  return matchAll(text, PAN, 'PAN', (v) => ('PCHABGJLFT'.includes(v[3]) ? 1 : 0.8));
}
