import { describe, it } from 'vitest';
import * as _fc from 'fast-check';

/**
 * Property: Determinism
 * Given the same seed and the same detector outputs, scrub output MUST be identical.
 * BRIEF §8.6.
 */
describe('Property: determinism', () => {
  it.todo('same seed produces identical output', () => {
    // Implementation: scrub the same text twice with the same seed.
    // Assert byte-for-byte equality.
  });
});
