import type { Detector, DetectorConfig, Finding } from '../types.js';
import { detectEmail } from './email.js';
import { detectPhone } from './phone.js';
import { detectAadhaar } from './aadhaar.js';
import { detectPan } from './pan.js';
import { detectIfsc } from './ifsc.js';
import { detectBankAccount } from './bank-account.js';
import { detectCard } from './card.js';
import { detectUpi } from './upi.js';
import { detectApiKey } from './api-key.js';
import { detectJwt } from './jwt.js';
import { detectPrivateKey } from './private-key.js';
import { detectPassword } from './password.js';
import { detectIpAddress } from './ip-address.js';
import { detectUrlSecret } from './url-secret.js';
import { detectOrgTerm } from './org-term.js';

export {
  detectEmail, detectPhone, detectAadhaar, detectPan, detectIfsc, detectBankAccount, detectCard, detectUpi,
  detectApiKey, detectJwt, detectPrivateKey, detectPassword, detectIpAddress, detectUrlSecret, detectOrgTerm,
};

/** The 15 Layer A rule detectors, in BRIEF §8.1 table order. */
export const RULE_DETECTOR_FNS: Array<(text: string, config?: DetectorConfig) => Finding[]> = [
  detectEmail, detectPhone, detectAadhaar, detectPan, detectIfsc, detectBankAccount, detectCard, detectUpi,
  detectApiKey, detectJwt, detectPrivateKey, detectPassword, detectIpAddress, detectUrlSecret, detectOrgTerm,
];

/** Runs every rule detector synchronously. Instant, deterministic, always on (Layer A). */
export function detectRules(text: string, config?: DetectorConfig): Finding[] {
  return RULE_DETECTOR_FNS.flatMap((fn) => fn(text, config));
}

/** Layer A as a single Detector, so it plugs into scrub() next to the Nano detector (Layer B). */
export const rulesDetector: Detector = {
  detect: async (text, config) => detectRules(text, config),
};

/** Every rule detector wrapped as its own Detector (skeleton API). */
export const ALL_RULE_DETECTORS: Detector[] = RULE_DETECTOR_FNS.map((fn) => ({
  detect: async (text: string, config: DetectorConfig) => fn(text, config),
}));
