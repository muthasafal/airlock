import { describe, it } from 'vitest';
import * as _fc from 'fast-check';

/**
 * Property: Consistency
 * Within a session, equal original values MUST map to equal stand-ins across multiple scrub calls.
 * BRIEF §8.6.
 */
describe('Property: consistency', () => {
  it.todo('same original maps to same stand-in within a session', () => {
    // Implementation: scrub text containing "Alice" twice in separate calls.
    // Assert both map to the same stand-in.
  });
});
