import type { DetectorConfig, Finding } from '../types.js';
import { keywordBefore, matchAll } from './util.js';

const ACCOUNT = /(?<![\d])\d{9,18}(?![\d])/g;
const KEYWORDS = /(account|a\/c|acct)/i;

/** 9 to 18 digit runs within 30 characters after "account", "a/c" or "acct". BRIEF §8.1 BANK_ACCOUNT. */
export function detectBankAccount(text: string, _config?: DetectorConfig): Finding[] {
  return matchAll(text, ACCOUNT, 'BANK_ACCOUNT', (_v, m) => keywordBefore(text, m.index, KEYWORDS, 30));
}
