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
 * Property 5, non-collision (BRIEF §8.6.5; design P5, requirement R29).
 * No stand-in equals (case-insensitively) any original substring in the session.
 */
describe('Property 5: non-collision', () => {
  it('no stand-in appears inside any original text of the session', () => {
    fc.assert(
      fc.property(doc, doc, seed, (a, b, s) => {
        const mapping = createSessionMapping(s);
        const results = [a, b].map((d) => run(d, mapping, defaultPolicy));
        const originals = [a.text, b.text].map((t) => t.toLowerCase());
        for (const r of results) {
          for (const act of r.actions) {
            if (act.action !== 'PSEUDONYMIZE' || !act.replacement) continue;
            const standIn = act.replacement.toLowerCase();
            if (originals.some((o) => o.includes(standIn))) return false;
          }
        }
        return true;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
