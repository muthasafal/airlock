import { describe, it } from 'vitest';
import * as _fc from 'fast-check';

/**
 * Property: No leak
 * For any input containing planted secrets that the detectors find,
 * the outbound payload MUST contain none of the original sensitive substrings
 * (case-insensitive comparison) for every category whose action is not KEEP.
 * BRIEF §8.6.
 */
describe('Property: no-leak', () => {
  it.todo('scrubbed text does not contain original secrets', () => {
    // Implementation: generate documents with known secrets in all categories.
    // Run scrub. Assert no original secret appears in the scrubbed output.
  });
});
