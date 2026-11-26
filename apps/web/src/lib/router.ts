import type { Finding } from '@airlock/scrub-engine';
import type { TaskClassification } from '@airlock/nano-detector';

/**
 * Hybrid router: decides per-request whether to answer locally, send scrubbed text to cloud, or block.
 * BRIEF §8.4 decision table and plain-English reasons.
 */

export type RouteDecision = 'LOCAL_ANSWER' | 'CLOUD_SCRUBBED' | 'BLOCK';

/** What the user picked for this message: let Airlock decide, or force a route. */
export type RouteOverride = 'AUTO' | 'LOCAL_ANSWER' | 'CLOUD_SCRUBBED' | 'SEND_WITHOUT_SECRET';

export interface RouterInput {
  /** Length of the scrubbed text (BRIEF §8.4 input). */
  scrubbedLength: number;
  findings: Finding[];
  /** Findings whose action is BLOCK (their values were replaced with ‹secret-N›). */
  blockedCount: number;
  nanoAvailable: boolean;
  /** Set when Nano exists but did not finish for this message (rules only ran). */
  reducedBecause?: string;
  consentGiven: boolean;
  classification: TaskClassification | null;
  userOverride?: RouteOverride;
  blockRequestOnSecret: boolean;
  localAnswerMaxChars: number;
  cloudModel: string;
  cloudModelHard: string;
}

export interface RouterDecision {
  route: RouteDecision;
  reason: string; // Plain English. BRIEF §8.4.
  model?: string; // Set for CLOUD_SCRUBBED.
  /** True when the user must turn on reduced-protection consent before anything is sent. */
  needsConsent?: boolean;
}

const LOCAL_TASKS = new Set(['REWRITE', 'SUMMARIZE_SHORT', 'TRANSLATE_SHORT']);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Step 2 of BRIEF §8.4 (pure): applies the decision table to the inputs, including the user's
 * override, and returns the route with a plain-English reason for the receipt.
 */
export function decideRoute(i: RouterInput): RouterDecision {
  const cloudModel =
    i.classification && (i.classification.task === 'REASONING' || i.classification.task === 'CODE') && i.classification.complexity === 'HIGH'
      ? i.cloudModelHard
      : i.cloudModel;

  if (i.userOverride === 'LOCAL_ANSWER') {
    if (!i.nanoAvailable) {
      return { route: 'BLOCK', reason: "You asked for an on-device answer, but this browser can't run the private model, so nothing was sent." };
    }
    return { route: 'LOCAL_ANSWER', reason: 'You chose "Answer on my device only", so the message never left this device.' };
  }

  if (i.blockedCount > 0 && i.blockRequestOnSecret && i.userOverride !== 'SEND_WITHOUT_SECRET') {
    return {
      route: 'BLOCK',
      reason: `We held back ${plural(i.blockedCount, 'secret')} and stopped the request. You can send it without the secret, and the model will only see a placeholder.`,
    };
  }

  if (!i.nanoAvailable && !i.consentGiven) {
    return {
      route: 'BLOCK',
      needsConsent: true,
      reason: `${i.reducedBecause ?? "This browser can't run the private model"}, so we only used our rule checks. Turn on reduced protection to send the cleaned text.`,
    };
  }

  if (i.userOverride === 'CLOUD_SCRUBBED' || i.userOverride === 'SEND_WITHOUT_SECRET') {
    return { route: 'CLOUD_SCRUBBED', model: cloudModel, reason: withheldNote(i, 'You chose the cloud, so only the cleaned text was sent.') };
  }

  const c = i.classification;
  if (
    i.nanoAvailable &&
    c &&
    c.complexity === 'LOW' &&
    LOCAL_TASKS.has(c.task) &&
    i.scrubbedLength <= i.localAnswerMaxChars
  ) {
    const task = c.task === 'REWRITE' ? 'a short rewrite' : c.task === 'SUMMARIZE_SHORT' ? 'a short summary' : 'a short translation';
    return { route: 'LOCAL_ANSWER', reason: `This looked like ${task}, so the private model answered it right here.` };
  }

  const why = !i.nanoAvailable
    ? 'Reduced protection is on, so the rule-cleaned text went to the cloud.'
    : c
      ? `This needed the cloud (${c.task.toLowerCase().replace(/_/g, ' ')}, ${c.complexity.toLowerCase()} effort), so only the cleaned text was sent.`
      : 'Only the cleaned text was sent to the cloud.';
  return { route: 'CLOUD_SCRUBBED', model: cloudModel, reason: withheldNote(i, why) };
}

function withheldNote(i: RouterInput, base: string): string {
  return i.blockedCount > 0 ? `${base} We held back ${plural(i.blockedCount, 'secret')}.` : base;
}

/**
 * Two-step decision: (1) classify task on-device (done by the caller with classifyTask on the
 * scrubbed text), (2) apply the BRIEF §8.4 decision table.
 */
export async function routeRequest(input: RouterInput): Promise<RouterDecision> {
  return decideRoute(input);
}
