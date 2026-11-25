import { describe, it } from 'vitest';
import * as _fc from 'fast-check';

/**
 * Property: Fakes stay fake
 * - Generated card numbers MUST fail Luhn check
 * - Generated Aadhaar numbers MUST fail Verhoeff check
 * - Generated emails MUST use `.example` TLD
 * - Generated phone numbers MUST be clearly fictional (Indian: ends in `0000x` block)
 * BRIEF §8.6.
 */
describe('Property: fakes-stay-fake', () => {
  it.todo('generated stand-ins are invalid by design', () => {
    // Implementation: generate stand-ins for each type.
    // Assert validation fails (Luhn, Verhoeff, etc.).
  });
});
