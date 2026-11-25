export { detectEmail } from './email';
export { detectPhone } from './phone';
export { detectAadhaar } from './aadhaar';
export { detectPan } from './pan';
export { detectIfsc } from './ifsc';
export { detectBankAccount } from './bank-account';
export { detectCard } from './card';
export { detectUpi } from './upi';
export { detectApiKey } from './api-key';
export { detectJwt } from './jwt';
export { detectPrivateKey } from './private-key';
export { detectPassword } from './password';
export { detectIpAddress } from './ip-address';
export { detectUrlSecret } from './url-secret';
export { detectOrgTerm } from './org-term';

import { Detector } from '../types';

export const ALL_RULE_DETECTORS: Detector[] = [];
