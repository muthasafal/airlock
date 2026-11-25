import type { DetectorConfig, Finding } from '../types.js';
import { matchAll } from './util.js';

const INDIAN = /(?<![\d+]|\d[\s-])(?:\+91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}(?![\s-]?\d)/g;
const INTL = /(?<![\d+])\+\d{1,3}[\s-]?\d{6,14}(?![\s-]?\d)/g;

/**
 * Indian mobiles (+91 / 0 prefixes, optional 5-5 split) and international +CC numbers.
 * Runs inside longer digit strings are rejected by the digit look-arounds. BRIEF §8.1 PHONE.
 */
export function detectPhone(text: string, _config?: DetectorConfig): Finding[] {
  const indian = matchAll(text, INDIAN, 'PHONE');
  const intl = matchAll(text, INTL, 'PHONE').filter(
    (f) => !indian.some((i) => f.start < i.end && i.start < f.end),
  );
  return [...indian, ...intl];
}
