import type { DetectorConfig, Finding } from '../types.js';
import { matchAll } from './util.js';

/** RFC-lite email addresses. BRIEF §8.1 Layer A EMAIL. */
export const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** Detects EMAIL spans using the RFC-lite regex. BRIEF §8.1 Layer A. */
export function detectEmail(text: string, _config?: DetectorConfig): Finding[] {
  return matchAll(text, EMAIL_RE, 'EMAIL');
}
