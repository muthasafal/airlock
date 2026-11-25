import { Finding } from '@airlock/scrub-engine';

/**
 * Hybrid router: decides per-request whether to answer locally, send scrubbed text to cloud, or block.
 * BRIEF §8.4 decision table and plain-English reasons.
 */

export type RouteDecision = 'LOCAL_ANSWER' | 'CLOUD_SCRUBBED' | 'BLOCK';

export interface RouterInput {
  text: string;
  findings: Finding[];
  nanoAvailable: boolean;
  consentGiven: boolean;
  userOverride?: RouteDecision;
}

export interface RouterDecision {
  route: RouteDecision;
  reason: string; // Plain English. BRIEF §8.4.
  model?: string; // Set for CLOUD_SCRUBBED.
}

/**
 * Two-step decision: (1) classify task on-device, (2) apply BRIEF §8.4 decision table.
 * Returns a RouterDecision with a plain-English reason.
 */
export async function routeRequest(_input: RouterInput): Promise<RouterDecision> {
  throw new Error('not implemented: architecture-skeleton');
}
