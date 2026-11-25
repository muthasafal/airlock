/**
 * Verhoeff checksum implementation.
 * BRIEF §8.1 AADHAAR, §8.2 "Fakes stay fake" invariant.
 */

/** Validates a string of digits against the Verhoeff checksum. */
export function verhoeffCheck(_digits: string): boolean {
  throw new Error('not implemented: architecture-skeleton');
}

/** Returns true if the digits deliberately FAIL Verhoeff (for generated stand-ins). */
export function verhoeffFail(_digits: string): boolean {
  throw new Error('not implemented: architecture-skeleton');
}
