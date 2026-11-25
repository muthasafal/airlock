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
 * Property 4, injectivity (BRIEF §8.6.4; design P4).
 * Distinct originals never share a stand-in.
 */
describe('Property 4: injectivity', () => {
  it('distinct originals never share a stand-in', () => {
    fc.assert(
      fc.property(doc, doc, seed, (a, b, s) => {
        const mapping = createSessionMapping(s);
        const owner = new Map<string, string>();
        for (const d of [a, b]) {
          for (const act of run(d, mapping, defaultPolicy).actions) {
            if (act.action !== 'PSEUDONYMIZE' || !act.replacement) continue;
            const standIn = act.replacement.toLowerCase();
            const original = act.finding.text.toLowerCase();
            if (owner.has(standIn) && owner.get(standIn) !== original) return false;
            owner.set(standIn, original);
          }
        }
        return true;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
