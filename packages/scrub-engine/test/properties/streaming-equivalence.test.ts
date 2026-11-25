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
 * Property 9, streaming equivalence (BRIEF §8.6.9; design P9, requirement R35).
 * Restoring a stream chunk by chunk equals restoring the whole string, for any chunking.
 */
describe('Property 9: streaming equivalence', () => {
  it('chunked restore equals whole restore', () => {
    fc.assert(
      fc.property(doc, seed, fc.array(fc.integer({ min: 0, max: 400 }), { maxLength: 12 }), (d, s, cuts) => {
        const mapping = createSessionMapping(s);
        const out = run(d, mapping, defaultPolicy).text;
        const answer = `Sure! ${out} Thanks.`;
        const whole = restore(answer, mapping).text;
        const points = [...new Set(cuts.map((c) => c % (answer.length + 1)))].sort((x, y) => x - y);
        const buf = createStreamingRestoreBuffer(mapping, 0);
        let streamed = '';
        let prev = 0;
        for (const p of [...points, answer.length]) {
          streamed += buf.push(answer.slice(prev, p));
          prev = p;
        }
        streamed += buf.flush();
        return streamed === whole;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
