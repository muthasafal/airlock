/**
 * Core types for the scrub engine
 * This package is pure TypeScript with no DOM or React dependencies
 */

export type Category =
  // Rule-detected structured types
  | 'EMAIL'
  | 'PHONE'
  | 'AADHAAR'
  | 'PAN'
  | 'IFSC'
  | 'BANK_ACCOUNT'
  | 'CARD'
  | 'UPI'
  | 'API_KEY'
  | 'JWT'
  | 'PRIVATE_KEY'
  | 'PASSWORD'
  | 'IP_ADDRESS'
  | 'URL_SECRET'
  | 'ORG_TERM'
  // Nano-detected contextual types
  | 'PERSON'
  | 'ORG'
  | 'LOCATION'
  | 'HEALTH'
  | 'FINANCIAL_AMOUNT'
  | 'LEGAL_MATTER'
  | 'INTERNAL_PROJECT'
  | 'CREDENTIAL'
  | 'GOVERNMENT_ID'
  | 'DATE_OF_BIRTH'
  | 'OTHER_SENSITIVE';

export type Action = 'PSEUDONYMIZE' | 'GENERALIZE' | 'BLOCK' | 'KEEP';

export type DetectorType = 'RULE' | 'NANO';

export interface Finding {
  /** Start offset in the input text */
  start: number;
  /** End offset (exclusive) */
  end: number;
  /** The detected text */
  text: string;
  /** Category of the finding */
  category: Category;
  /** Which detector found it */
  detector: DetectorType;
  /** Confidence score (0-1) */
  confidence: number;
}

export interface PolicyRule {
  category: Category;
  action: Action;
}

export interface Policy {
  rules: PolicyRule[];
  /** Admin-entered protected terms (not user content) */
  protectedTerms?: Array<{
    term: string;
    category: Category;
    action: Action;
  }>;
}

export interface SessionMapping {
  /** Original value → stand-in */
  forward: Map<string, string>;
  /** Stand-in → original */
  reverse: Map<string, string>;
  /** Aliases (e.g., first name only, surname only) */
  aliases: Map<string, string>;
  /** All original values seen in this session (for collision check) */
  originals: Set<string>;
  /** Session seed for deterministic PRNG */
  seed: number;
}

export interface ScrubResult {
  /** The scrubbed text */
  text: string;
  /** All findings (after merge and policy) */
  findings: Finding[];
  /** Updated session mapping */
  mapping: SessionMapping;
  /** Actions taken per finding */
  actions: Array<{
    finding: Finding;
    action: Action;
    replacement?: string;
  }>;
}

export interface RestoreResult {
  /** The restored text */
  text: string;
  /** Spans that were restored */
  restoredSpans: Array<{
    start: number;
    end: number;
    standIn: string;
    original: string;
  }>;
}

export interface DetectorConfig {
  /** Minimum confidence for Nano findings */
  nanoMinConfidence: number;
  /** Protected terms from org policy */
  protectedTerms?: Array<{
    term: string;
    category: Category;
  }>;
}
