import type { DetectorConfig, Finding } from '../types.js';
import { shannonEntropy } from '../checksums/entropy.js';
import { keywordBefore, matchAll } from './util.js';

/** Well-known provider key prefixes. BRIEF §8.1 API_KEY. */
const PREFIXED = new RegExp(
  [
    'sk-ant-[A-Za-z0-9_-]{16,}',
    'sk-[A-Za-z0-9_-]{16,}',
    'AKIA[0-9A-Z]{16}',
    'AIza[0-9A-Za-z_-]{35}',
    '(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}',
    'github_pat_[A-Za-z0-9_]{22,}',
    'xox[baprs]-[A-Za-z0-9-]{10,}',
    'glpat-[A-Za-z0-9_-]{20,}',
    '(?:rk|sk)_live_[A-Za-z0-9]{10,}',
  ].join('|'),
  'g',
);
const TOKEN = /(?<![A-Za-z0-9+/=_-])[A-Za-z0-9+/=_-]{24,}(?![A-Za-z0-9+/=_-])/g;
const KEYWORDS = /(key|token|secret|password|passwd|credential|bearer)/i;

function mixedClasses(s: string): boolean {
  let classes = 0;
  if (/[a-z]/.test(s)) classes++;
  if (/[A-Z]/.test(s)) classes++;
  if (/\d/.test(s)) classes++;
  return classes >= 2 && /\d/.test(s);
}

/**
 * Provider keys by prefix, plus generic high-entropy tokens (length >= 24, entropy >= 3.5,
 * mixed character classes) within 30 characters after key/token/secret/password. BRIEF §8.1 API_KEY.
 */
export function detectApiKey(text: string, _config?: DetectorConfig): Finding[] {
  const prefixed = matchAll(text, PREFIXED, 'API_KEY');
  const generic = matchAll(text, TOKEN, 'API_KEY', (v, m) =>
    shannonEntropy(v) >= 3.5 && mixedClasses(v) && keywordBefore(text, m.index, KEYWORDS, 30) ? 0.9 : false,
  ).filter((g) => !prefixed.some((p) => g.start < p.end && p.start < g.end));
  return [...prefixed, ...generic];
}
