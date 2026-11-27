import type { DetectorConfig, Finding } from '../types.js';
import { matchAll } from './util.js';

/**
 * Keyword, then ":" / "=" / "is", then the value. Covers passwords, PINs, OTPs and one-time
 * codes, passcodes, CVV and security codes. Trailing punctuation (", . ; !") is not part of the
 * value.
 */
const PASSWORD =
  /\b(?:password|passwd|pwd|pin|otp|passcode|pass code|one[- ]time (?:password|code|pin)|verification code|security code|auth(?:entication)? code|cvv|cvc)\s*(?:[:=]|\bis\b)\s*([^\s,;!?]+?)(?=[.,;!?]?(?:\s|$))/gi;

/** The value after "password:", "pwd=", "pin:", "OTP:", "code is" and similar (the value only). BRIEF §8.1 PASSWORD. */
export function detectPassword(text: string, _config?: DetectorConfig): Finding[] {
  return matchAll(text, PASSWORD, 'PASSWORD', () => true, 1);
}
