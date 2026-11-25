import type { DetectorConfig, Finding } from '../types.js';
import { matchAll } from './util.js';

const JWT = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

/** JSON Web Tokens (three base64url segments starting with eyJ). BRIEF §8.1 JWT. */
export function detectJwt(text: string, _config?: DetectorConfig): Finding[] {
  return matchAll(text, JWT, 'JWT');
}
