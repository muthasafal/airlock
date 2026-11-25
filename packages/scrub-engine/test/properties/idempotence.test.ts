import { describe, it } from 'vitest';
import * as _fc from 'fast-check';

/**
 * Property: Idempotence of detection
 * Scrubbing already-scrubbed text MUST create no new findings for the stand-ins it introduced.
 * BRIEF §8.6.
 */
describe('Property: idempotence', () => {
  it.todo('scrubbing scrubbed text creates no new findings', () => {
    // Implementation: scrub text. Scrub the output. Assert the second pass finds no new secrets in stand-ins.
  });
});
