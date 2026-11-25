import type { DetectorConfig, Finding } from '../types.js';
import { matchAll } from './util.js';

// The handle is letters only and must not continue as an email domain (".com" etc.).
const UPI = /(?<![\w.@-])[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{3,}(?![\w.@-])/g;

/** UPI payment addresses like name@okbank, never matching email addresses. BRIEF §8.1 UPI. */
export function detectUpi(text: string, _config?: DetectorConfig): Finding[] {
  return matchAll(text, UPI, 'UPI');
}
