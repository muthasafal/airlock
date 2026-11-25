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
 * Property 1, no leak (BRIEF §8.6.1; scrub-engine design P1, requirements R1-R20).
 * For any document with planted secrets of every category, the outbound text contains none of
 * the original sensitive substrings (case-insensitive) for categories whose action is not KEEP.
 */
describe('Property 1: no leak', () => {
  it('scrubbed text contains no planted secret', () => {
    fc.assert(
      fc.property(doc, seed, (d, s) => {
        const r = run(d, createSessionMapping(s), defaultPolicy);
        const out = r.text.toLowerCase();
        for (const p of d.planted) {
          if (out.includes(p.value.toLowerCase())) return false;
        }
        return true;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
