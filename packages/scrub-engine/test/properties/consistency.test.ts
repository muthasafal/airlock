import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createSessionMapping } from '../../src/stand-ins.js';
import { detectRules } from '../../src/detectors/index.js';
import { scrubWithFindings } from '../../src/scrub.js';
import { restore, createStreamingRestoreBuffer } from '../../src/restore.js';
import { luhnCheck } from '../../src/checksums/luhn.js';
import { verhoeffCheck } from '../../src/checksums/verhoeff.js';
import type { Policy, SessionMapping } from '../../src/types.js';
import { doc, seed, defaultPolicy, pseudonymizeAll, NUM_RUNS, type Doc } from './arbitraries.js';

const run = (d: Doc, mapping: SessionMapping, policy: Policy) =>
  scrubWithFindings(
    d.text,
    [...detectRules(d.text, { nanoMinConfidence: 0.5, protectedTerms: policy.protectedTerms }), ...d.nanoFindings],
    mapping,
    policy,
  );
// Keep the imports used in every file so each property file is self-contained.
void restore; void createStreamingRestoreBuffer; void luhnCheck; void verhoeffCheck; void pseudonymizeAll; void expect;

/**
 * Property 3, consistency (BRIEF §8.6.3; design P3).
 * Within a session, equal originals map to equal stand-ins across scrub calls.
 */
describe('Property 3: consistency', () => {
  it('the same original gets the same stand-in across messages', () => {
    fc.assert(
      fc.property(doc, doc, seed, (a, b, s) => {
        const mapping = createSessionMapping(s);
        const seen = new Map<string, string>();
        for (const d of [a, b, a]) {
          for (const act of run(d, mapping, defaultPolicy).actions) {
            if (act.action !== 'PSEUDONYMIZE' || !act.replacement) continue;
            const key = act.finding.text.toLowerCase();
            const value = act.replacement.toLowerCase();
            if (seen.has(key) && seen.get(key) !== value) return false;
            seen.set(key, value);
          }
        }
        return true;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
