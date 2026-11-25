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
 * Property 6, fakes stay fake (BRIEF §8.6.6; design P6, requirement R25).
 * Generated card numbers fail Luhn, Aadhaar numbers fail Verhoeff, emails use .example,
 * Indian phone stand-ins end in a 0000x block.
 */
describe('Property 6: fakes stay fake', () => {
  it('generated identifiers can never be real', () => {
    fc.assert(
      fc.property(doc, seed, (d, s) => {
        const r = run(d, createSessionMapping(s), defaultPolicy);
        for (const act of r.actions) {
          const v = act.replacement;
          if (act.action !== 'PSEUDONYMIZE' || !v) continue;
          const digits = v.replace(/\D/g, '');
          switch (act.finding.category) {
            case 'CARD':
              if (luhnCheck(digits)) return false;
              break;
            case 'AADHAAR':
              if (verhoeffCheck(digits)) return false;
              break;
            case 'EMAIL':
              if (!v.toLowerCase().endsWith('.example')) return false;
              break;
            case 'PHONE':
              if (!/0000\d$/.test(digits) || digits.slice(-10)[0] !== '9') return false;
              break;
          }
        }
        return true;
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
