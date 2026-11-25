import type { DetectorConfig, Finding } from '../types.js';
import { luhnCheck } from '../checksums/luhn.js';
import { matchAll } from './util.js';

const CARD = /(?<!\d[\s-]?)\d(?:[ -]?\d){12,18}(?![\s-]?\d)/g;

/** 13 to 19 digit card numbers (spaces or dashes allowed) that pass Luhn. BRIEF §8.1 CARD. */
export function detectCard(text: string, _config?: DetectorConfig): Finding[] {
  return matchAll(text, CARD, 'CARD', (v) => {
    const digits = v.replace(/\D/g, '');
    return digits.length >= 13 && digits.length <= 19 && luhnCheck(digits);
  });
}
