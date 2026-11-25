import type { Action, Category, Policy, PolicySources } from './types.js';

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

/** Every category, in a stable order. */
export const ALL_CATEGORIES = Object.keys(DEFAULT_POLICY) as Category[];

/**
 * Resolves the effective action for a category using the resolution order:
 * org policy > user settings > Remote Config defaults > built-in defaults.
 * BRIEF §8.3.
 */
export function resolveAction(category: Category, sources: PolicySources): Action {
  return (
    sources.orgPolicy?.[category] ??
    sources.userSettings?.[category] ??
    sources.remoteConfig?.[category] ??
    DEFAULT_POLICY[category]
  );
}

/** Builds a full Policy (one rule per category) from the layered sources, plus org protected terms. */
export function buildPolicy(sources: PolicySources, protectedTerms: Policy['protectedTerms'] = []): Policy {
  return {
    rules: ALL_CATEGORIES.map((category) => ({ category, action: resolveAction(category, sources) })),
    protectedTerms,
  };
}

/** The action a policy assigns to a finding. A protected term's own action wins for that term. */
export function actionFor(policy: Policy, category: Category, text?: string): Action {
  if (text && policy.protectedTerms?.length) {
    const lower = text.trim().toLowerCase();
    const term = policy.protectedTerms.find((t) => t.term.trim().toLowerCase() === lower);
    if (term) return term.action;
  }
  return policy.rules.find((r) => r.category === category)?.action ?? DEFAULT_POLICY[category];
}
