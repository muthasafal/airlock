/**
 * Luhn algorithm implementation.
 * BRIEF §8.1 CARD, §8.2 "Fakes stay fake" invariant.
 */

/** Validates a string of digits against the Luhn checksum. */
export function luhnCheck(_digits: string): boolean {
  throw new Error('not implemented: architecture-skeleton');
}

/** Returns true if the digits deliberately FAIL Luhn (for generated stand-ins). */
export function luhnFail(_digits: string): boolean {
  throw new Error('not implemented: architecture-skeleton');
}
