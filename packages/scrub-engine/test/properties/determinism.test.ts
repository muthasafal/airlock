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
 * Property 7, determinism (BRIEF §8.6.7; design P7, requirement R31).
 * Same seed and same detector outputs give the same output.
 */
describe('Property 7: determinism', () => {
  it('same seed and findings give identical output', () => {
    fc.assert(
      fc.property(doc, seed, (d, s) => {
        const x = run(d, createSessionMapping(s), defaultPolicy);
        const y = run(d, createSessionMapping(s), defaultPolicy);
        return x.text === y.text && JSON.stringify(x.actions) === JSON.stringify(y.actions);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
