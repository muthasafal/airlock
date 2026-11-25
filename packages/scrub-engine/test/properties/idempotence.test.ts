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
 * Property 8, idempotence of detection (BRIEF §8.6.8; design P8).
 * Scrubbing already-scrubbed text creates no new findings for the stand-ins it introduced.
 */
describe('Property 8: idempotence', () => {
  it('re-scrubbing the outbound text finds nothing new', () => {
    fc.assert(
      fc.property(doc, seed, (d, s) => {
        const mapping = createSessionMapping(s);
        const once = run(d, mapping, defaultPolicy);
        const twice = scrubWithFindings(once.text, detectRules(once.text), mapping, defaultPolicy);
        return twice.findings.length === 0 && twice.text === once.text;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
