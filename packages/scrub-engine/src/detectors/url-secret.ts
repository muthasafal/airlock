import type { DetectorConfig, Finding } from '../types.js';
import { ruleFinding } from './util.js';

const URL_RE = /https?:\/\/[^\s<>"']+/g;
const PARAM = /[?&](?:token|key|sig|signature|auth|password|api_key|apikey|access_token|secret)=([^&#\s]+)/gi;

/** Secret-bearing query values in URLs (token=, key=, sig=, auth=, password=); the value only. BRIEF §8.1 URL_SECRET. */
export function detectUrlSecret(text: string, _config?: DetectorConfig): Finding[] {
  const out: Finding[] = [];
  for (const url of text.matchAll(URL_RE)) {
    const base = url.index ?? 0;
    for (const p of url[0].matchAll(PARAM)) {
      const value = p[1];
      const offset = (p.index ?? 0) + p[0].length - value.length;
      out.push(ruleFinding(value, base + offset, 'URL_SECRET'));
    }
  }
  return out;
}
