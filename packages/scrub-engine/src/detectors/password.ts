import type { DetectorConfig, Finding } from '../types.js';
import { matchAll } from './util.js';

const PASSWORD = /\b(?:password|passwd|pwd|pin)\s*[:=]\s*(\S+)/gi;

/** The value after "password:", "pwd=", "pin:" and similar (the value only). BRIEF §8.1 PASSWORD. */
export function detectPassword(text: string, _config?: DetectorConfig): Finding[] {
  return matchAll(text, PASSWORD, 'PASSWORD', () => true, 1);
}
