import { Category, Action, PolicySources } from './types';

/**
 * Default action per category.
 * BRIEF §8.3: Policy defaults, resolution order.
 */
export const DEFAULT_POLICY: Record<Category, Action> = {
  PERSON: 'PSEUDONYMIZE',
  ORG: 'PSEUDONYMIZE',
  EMAIL: 'PSEUDONYMIZE',
  PHONE: 'PSEUDONYMIZE',
  LOCATION: 'PSEUDONYMIZE',
  ORG_TERM: 'PSEUDONYMIZE',
  INTERNAL_PROJECT: 'PSEUDONYMIZE',
  UPI: 'PSEUDONYMIZE',
  AADHAAR: 'PSEUDONYMIZE',
  PAN: 'PSEUDONYMIZE',
  CARD: 'PSEUDONYMIZE',
  BANK_ACCOUNT: 'PSEUDONYMIZE',
  IFSC: 'PSEUDONYMIZE',
  GOVERNMENT_ID: 'PSEUDONYMIZE',
  FINANCIAL_AMOUNT: 'GENERALIZE',
  HEALTH: 'GENERALIZE',
  LEGAL_MATTER: 'GENERALIZE',
  DATE_OF_BIRTH: 'GENERALIZE',
  API_KEY: 'BLOCK',
  JWT: 'BLOCK',
  PRIVATE_KEY: 'BLOCK',
  PASSWORD: 'BLOCK',
  CREDENTIAL: 'BLOCK',
  URL_SECRET: 'BLOCK',
  IP_ADDRESS: 'PSEUDONYMIZE',
  OTHER_SENSITIVE: 'PSEUDONYMIZE',
};

/**
 * Resolves the effective action for a category using the resolution order:
 * org policy > user settings > Remote Config defaults > built-in defaults.
 * BRIEF §8.3.
 */
export function resolveAction(_category: Category, _sources: PolicySources): Action {
  throw new Error('not implemented: architecture-skeleton');
}
