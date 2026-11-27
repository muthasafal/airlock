import {
  buildPolicy,
  countByCategory,
  detectRules,
  restore,
  rulesDetector,
  scrub,
  type Category,
  type Detector,
} from '@airlock/scrub-engine';
import { localModelDetector } from './local-model.js';
import { DEFAULT_TTL_HOURS, loadSession, saveSession } from './vault.js';

/**
 * Clean, restore and check for the CLI and MCP server (integrations R1, R3). Thin layer over
 * the scrub engine so the BRIEF §8.6 properties hold here too.
 */

/** Categories the secret guard blocks (same list as the Kiro secret-guard hook). */
export const BLOCKING: ReadonlySet<Category> = new Set<Category>(['API_KEY', 'JWT', 'PRIVATE_KEY', 'PASSWORD', 'AADHAAR', 'PAN', 'CARD']);

export interface CleanOptions {
  session?: string;
  localModel?: string;
  ttlHours?: number;
}

export interface CleanResult {
  text: string;
  counts: Partial<Record<Category, number>>;
  withheldSecrets: number;
  /** "rules + local model" or "rules only" (integrations R8.1). */
  detection: string;
}

const label = (c: string) => c.toLowerCase().replace(/_/g, ' ');

/** "3 details swapped (1 email, 2 person), 1 secret withheld. Rules only." Never contains values. */
export function summary(r: Pick<CleanResult, 'counts' | 'withheldSecrets' | 'detection'>): string {
  const entries = Object.entries(r.counts).filter(([, n]) => (n ?? 0) > 0);
  const total = entries.reduce((a, [, n]) => a + (n ?? 0), 0);
  const parts = entries.map(([c, n]) => `${n} ${label(c)}`).join(', ');
  const head = total === 0 ? 'Nothing sensitive found' : `${total} detail${total === 1 ? '' : 's'} cleaned (${parts})`;
  const withheld = r.withheldSecrets ? `, ${r.withheldSecrets} secret${r.withheldSecrets === 1 ? '' : 's'} withheld` : '';
  return `${head}${withheld}. Detection: ${r.detection}.`;
}

export async function cleanText(text: string, opts: CleanOptions = {}): Promise<CleanResult> {
  const session = opts.session ?? 'default';
  const mapping = loadSession(session);
  const localSpec = opts.localModel ?? process.env.AIRLOCK_LOCAL_MODEL;
  const detectors: Detector[] = [rulesDetector];
  if (localSpec) detectors.push(localModelDetector(localSpec));
  const r = await scrub(text, detectors, mapping, buildPolicy({}));
  saveSession(mapping, session, opts.ttlHours ?? DEFAULT_TTL_HOURS);
  const localRan = Boolean(localSpec) && !r.failedDetectors;
  return {
    text: r.text,
    counts: countByCategory(r.findings),
    withheldSecrets: r.actions.filter((a) => a.action === 'BLOCK').length,
    detection: localRan ? 'rules + local model' : localSpec ? 'rules only (the local model did not answer)' : 'rules only',
  };
}

export function restoreText(text: string, session = 'default'): { text: string; restored: number } {
  const r = restore(text, loadSession(session));
  return { text: r.text, restored: r.restoredSpans.length };
}

/** Kinds and counts of blocking secrets in text. Never values. */
export function checkText(text: string): { blocking: Partial<Record<Category, number>>; all: Partial<Record<Category, number>> } {
  const findings = detectRules(text, { nanoMinConfidence: 0.5 });
  const all = countByCategory(findings);
  const blocking = countByCategory(findings.filter((f) => BLOCKING.has(f.category)));
  return { blocking, all };
}

export function describeBlocking(blocking: Partial<Record<Category, number>>): string {
  const kinds = Object.keys(blocking).map(label);
  const n = Object.values(blocking).reduce((a, b) => a + (b ?? 0), 0);
  return `Airlock stopped this: it contains ${n} secret${n === 1 ? '' : 's'} (${kinds.join(', ')}). Remove ${n === 1 ? 'it' : 'them'} or use a placeholder, then try again.`;
}
