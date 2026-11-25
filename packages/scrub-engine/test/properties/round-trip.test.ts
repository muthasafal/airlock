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
void restore; void createStreamingRestoreBuffer; void luhnCheck; void verhoeffCheck; void pseudonymizeAll; void defaultPolicy; void expect;

/**
 * Property 2, round trip (BRIEF §8.6.2; design P2, requirements R21-R29, R32-R35).
 * With PSEUDONYMIZE for every category, restore(scrub(x).text, mapping) === x.
 */
describe('Property 2: round trip', () => {
  it('restore(scrub(x)) returns the original text', () => {
    fc.assert(
      fc.property(doc, seed, (d, s) => {
        const mapping = createSessionMapping(s);
        const r = run(d, mapping, pseudonymizeAll);
        return restore(r.text, mapping).text === d.text;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
