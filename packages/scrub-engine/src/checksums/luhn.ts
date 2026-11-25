/**
 * Luhn algorithm. BRIEF §8.1 CARD, §8.6 invariant 6 ("fakes stay fake").
 */

/** True when the digit string passes the Luhn checksum. Non-digits are ignored. */
export function luhnCheck(digits: string): boolean {
  const d = digits.replace(/\D/g, '');
  if (d.length < 2) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** True when the digits deliberately FAIL Luhn (used to verify generated stand-ins). */
export function luhnFail(digits: string): boolean {
  return !luhnCheck(digits);
}
