import type { Action, Category, Detector, DetectorConfig, Finding, Policy, ScrubResult, SessionMapping } from './types.js';
import { mergeFindings } from './merge.js';
import { actionFor } from './policy.js';
import { createStandInGenerator, placeholder, transferCase } from './stand-ins.js';
import { generalize } from './generalize.js';
import { detectRules } from './detectors/index.js';

export interface ScrubOptions {
  /** Drop Nano findings below this confidence (Remote Config nano_min_confidence, default 0.5). */
  nanoMinConfidence?: number;
}

/** True when `text` is a stand-in or placeholder this session already issued (case-insensitive). */
function isKnownStandIn(text: string, mapping: SessionMapping): boolean {
  const t = text.toLowerCase();
  for (const k of mapping.reverse.keys()) if (k.toLowerCase() === t) return true;
  for (const k of mapping.aliases.keys()) if (k.toLowerCase() === t) return true;
  return false;
}

/** True when the finding lies inside a stand-in that the text already contains (re-scrubbing scrubbed text). */
function insideStandIn(text: string, f: Finding, mapping: SessionMapping): boolean {
  const lowerText = text.toLowerCase();
  for (const k of mapping.reverse.keys()) {
    const key = k.toLowerCase();
    if (key.length <= f.text.length) continue;
    let from = Math.max(0, f.end - key.length);
    while (from <= f.start) {
      const at = lowerText.indexOf(key, from);
      if (at < 0 || at > f.start) break;
      if (at + key.length >= f.end) return true;
      from = at + 1;
    }
  }
  return false;
}

/**
 * Applies already-merged findings to the text: resolves each action through the policy and
 * builds the outbound text (stand-ins, generalisations or ‹secret-N› placeholders).
 * Synchronous and pure apart from updating the session mapping. BRIEF §8.2, §8.3.
 */
export function applyFindings(text: string, findings: Finding[], mapping: SessionMapping, policy: Policy): ScrubResult {
  const generator = createStandInGenerator(mapping.seed);
  const actions: ScrubResult['actions'] = [];
  let out = '';
  let last = 0;
  for (const f of findings) {
    const action: Action = actionFor(policy, f.category, f.text);
    let replacement: string | undefined;
    switch (action) {
      case 'KEEP':
        replacement = undefined;
        break;
      case 'BLOCK':
        replacement = placeholder('secret', f.text, mapping);
        break;
      case 'GENERALIZE':
        replacement = generalize(f.category, f.text);
        break;
      case 'PSEUDONYMIZE': {
        const canonical = generator.generate(f.text, f.category, mapping);
        replacement = transferCase(f.text, canonical);
        // Remember this exact case variant so restore gives back exactly what was written.
        if (!mapping.reverse.has(replacement)) mapping.reverse.set(replacement, f.text);
        break;
      }
    }
    actions.push({ finding: f, action, replacement });
    out += text.slice(last, f.start) + (replacement ?? f.text);
    last = f.end;
  }
  out += text.slice(last);
  return { text: out, findings, mapping, actions };
}

/**
 * Synchronous scrub from detector outputs that are already known (rules, Nano results, tests).
 * Registers the text as a session original (for the collision check), drops findings that are
 * this session's own stand-ins (idempotence), merges (Layer C) and applies policy. BRIEF §8.1-8.3.
 */
export function scrubWithFindings(
  text: string,
  rawFindings: Finding[],
  mapping: SessionMapping,
  policy: Policy,
  options: ScrubOptions = {},
): ScrubResult {
  if (!text) return { text: '', findings: [], mapping, actions: [] };
  const config: DetectorConfig = {
    nanoMinConfidence: options.nanoMinConfidence ?? 0.5,
    protectedTerms: policy.protectedTerms?.map((t) => ({ term: t.term, category: t.category })),
  };
  const fresh = rawFindings.filter(
    (f) => f.start >= 0 && f.end <= text.length && !isKnownStandIn(f.text, mapping) && !insideStandIn(text, f, mapping),
  );
  const merged = mergeFindings(fresh, config);
  mapping.originals.add(text);
  for (const f of merged) mapping.originals.add(f.text);
  return applyFindings(text, merged, mapping, policy);
}

/** Rules-only scrub (Layer A), synchronous. Used for the instant live preview and the secret guard. */
export function scrubRulesOnly(text: string, mapping: SessionMapping, policy: Policy, options: ScrubOptions = {}): ScrubResult {
  const findings = detectRules(text, {
    nanoMinConfidence: options.nanoMinConfidence ?? 0.5,
    protectedTerms: policy.protectedTerms?.map((t) => ({ term: t.term, category: t.category })),
  });
  return scrubWithFindings(text, findings, mapping, policy, options);
}

/**
 * Entry point: runs detectors, merges findings (Layer C), applies policy,
 * generates stand-ins, and returns the scrubbed text with the updated mapping.
 * A detector that throws is skipped and reported in `failedDetectors`, so the caller can mark
 * protection as Reduced (BRIEF §8.1 Layer B timeouts). BRIEF §8.1–8.3.
 */
export async function scrub(
  text: string,
  detectors: Detector[],
  mapping: SessionMapping,
  policy: Policy,
  options: ScrubOptions = {},
): Promise<ScrubResult> {
  const config: DetectorConfig = {
    nanoMinConfidence: options.nanoMinConfidence ?? 0.5,
    protectedTerms: policy.protectedTerms?.map((t) => ({ term: t.term, category: t.category })),
  };
  const all: Finding[] = [];
  let failedDetectors = 0;
  for (const d of detectors) {
    try {
      all.push(...(await d.detect(text, config)));
    } catch {
      failedDetectors++;
    }
  }
  const result = scrubWithFindings(text, all, mapping, policy, options);
  return { ...result, failedDetectors };
}

/** Counts findings by category (what receipts and org stats report; never content). */
export function countByCategory(findings: Finding[]): Partial<Record<Category, number>> {
  const counts: Partial<Record<Category, number>> = {};
  for (const f of findings) counts[f.category] = (counts[f.category] ?? 0) + 1;
  return counts;
}
