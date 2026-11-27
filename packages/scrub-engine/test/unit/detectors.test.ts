import { describe, it, expect } from 'vitest';
import {
  detectEmail, detectPhone, detectAadhaar, detectPan, detectIfsc, detectBankAccount, detectCard, detectUpi,
  detectApiKey, detectJwt, detectPrivateKey, detectPassword, detectIpAddress, detectUrlSecret, detectOrgTerm,
} from '../../src/detectors/index.js';
import { luhnCheck } from '../../src/checksums/luhn.js';
import { verhoeffCheck } from '../../src/checksums/verhoeff.js';
import { shannonEntropy } from '../../src/checksums/entropy.js';

// All values are fictional test data.
const texts = (fs: Array<{ text: string }>) => fs.map((f) => f.text);

describe('checksums', () => {
  it('Luhn accepts valid and rejects invalid numbers', () => {
    expect(luhnCheck('4111111111111111')).toBe(true);
    expect(luhnCheck('4111111111111112')).toBe(false);
  });
  it('Verhoeff accepts valid and rejects invalid numbers', () => {
    expect(verhoeffCheck('2363')).toBe(true);
    expect(verhoeffCheck('2364')).toBe(false);
  });
  it('Shannon entropy is 0 for a repeated character and high for random text', () => {
    expect(shannonEntropy('aaaa')).toBe(0);
    expect(shannonEntropy('aZ3kQ9pL2mX7')).toBeGreaterThan(3.5);
  });
});

describe('EMAIL', () => {
  it('finds addresses', () => expect(texts(detectEmail('mail priya.shah@acme.com now'))).toEqual(['priya.shah@acme.com']));
  it('ignores text without a domain', () => expect(detectEmail('meet @ 5pm, a@b')).toEqual([]));
});

describe('PHONE', () => {
  it('finds Indian mobiles with and without prefixes', () => {
    expect(texts(detectPhone('call 98200 12345 or +91 9820012345 or 09820012345'))).toEqual([
      '98200 12345', '+91 9820012345', '09820012345',
    ]);
  });
  it('finds international numbers', () => expect(texts(detectPhone('ring +44 2071234567'))).toEqual(['+44 2071234567']));
  it('rejects runs inside longer digit strings', () => expect(detectPhone('id 123498200123456')).toEqual([]));
});

describe('AADHAAR', () => {
  it('needs a valid Verhoeff checksum', () => {
    expect(detectAadhaar('aadhaar 2345 6789 0124')).toHaveLength(1);
    expect(detectAadhaar('aadhaar 2345 6789 0125')).toHaveLength(0);
  });
  it('does not match inside a 16-digit card number (PBT counterexample)', () => {
    expect(detectAadhaar('5593 3936 4224 0007')).toEqual([]);
  });
});

describe('PAN', () => {
  it('finds PAN numbers with confidence by holder type', () => {
    expect(detectPan('PAN ABCPE1234F')[0].confidence).toBe(1);
    expect(detectPan('PAN ABCXE1234F')[0].confidence).toBe(0.8);
  });
  it('ignores lower case and wrong shapes', () => expect(detectPan('abcpe1234f ABCP1234F')).toEqual([]));
});

describe('IFSC', () => {
  it('finds IFSC codes', () => expect(texts(detectIfsc('IFSC HDFC0001234'))).toEqual(['HDFC0001234']));
  it('needs the fifth character to be zero', () => expect(detectIfsc('HDFC1001234')).toEqual([]));
});

describe('BANK_ACCOUNT', () => {
  it('needs a keyword within 30 characters', () => {
    expect(texts(detectBankAccount('account no: 123456789012'))).toEqual(['123456789012']);
    expect(detectBankAccount('order 123456789012')).toEqual([]);
  });
});

describe('CARD', () => {
  it('finds Luhn-valid cards with separators', () => expect(texts(detectCard('card 4111 1111 1111 1111.'))).toEqual(['4111 1111 1111 1111']));
  it('rejects Luhn-invalid numbers', () => expect(detectCard('4111 1111 1111 1112')).toEqual([]));
});

describe('UPI', () => {
  it('finds UPI ids', () => expect(texts(detectUpi('pay rohan@okaxis today'))).toEqual(['rohan@okaxis']));
  it('never matches an email address', () => expect(detectUpi('rohan@gmail.com')).toEqual([]));
});

describe('API_KEY', () => {
  it('finds known prefixes', () => {
    expect(detectApiKey('use sk-ant-abcdefghijklmnop1234 here')).toHaveLength(1);
    expect(detectApiKey('AKIAABCDEFGHIJKLMNOP')).toHaveLength(1);
    expect(detectApiKey('ghp_abcdefghijklmnopqrstuvwxyz0123456789')).toHaveLength(1);
  });
  it('finds high-entropy tokens near a keyword', () => {
    expect(detectApiKey('secret = q8Zr2LmXp4Vn7TbW1sKd9YcH')).toHaveLength(1);
  });
  it('ignores high-entropy text without a keyword, and plain words', () => {
    expect(detectApiKey('commit q8Zr2LmXp4Vn7TbW1sKd9YcH')).toEqual([]);
    expect(detectApiKey('the key is internationalization')).toEqual([]);
  });
});

describe('JWT', () => {
  it('finds three-part tokens', () => expect(detectJwt('Bearer eyJhbGciOi.eyJzdWIiOi.c2lnbmF0dXJl')).toHaveLength(1));
  it('ignores two-part strings', () => expect(detectJwt('eyJhbGciOi.eyJzdWIiOi')).toEqual([]));
});

describe('PRIVATE_KEY', () => {
  it('captures the whole PEM block', () => {
    const pem = '-----BEGIN RSA PRIVATE KEY-----\nMIIEabc\n-----END RSA PRIVATE KEY-----';
    expect(texts(detectPrivateKey(`key:\n${pem}\nthanks`))).toEqual([pem]);
  });
  it('ignores public keys', () => expect(detectPrivateKey('-----BEGIN PUBLIC KEY-----\nabc\n-----END PUBLIC KEY-----')).toEqual([]));
});

describe('PASSWORD', () => {
  it('captures the value only', () => expect(texts(detectPassword('password: hunter2 and pin=4321'))).toEqual(['hunter2', '4321']));
  it('ignores the word on its own', () => expect(detectPassword('reset your password please')).toEqual([]));
  it('catches OTPs, one-time codes and CVVs without trailing punctuation', () => {
    expect(texts(detectPassword('Hi Safal here, here is the OTP: 4978, tell me what to do next!'))).toEqual(['4978']);
    expect(texts(detectPassword('your verification code is 551203.'))).toEqual(['551203']);
    expect(texts(detectPassword('CVV=123'))).toEqual(['123']);
  });
});

describe('IP_ADDRESS', () => {
  it('finds valid IPv4 and IPv6', () => {
    expect(texts(detectIpAddress('host 10.0.0.12 and 2001:db8:85a3::8a2e:370:7334'))).toEqual(['10.0.0.12', '2001:db8:85a3::8a2e:370:7334']);
  });
  it('rejects invalid octets, versions and times', () => expect(detectIpAddress('999.1.1.1 v1.2.3 at 12:30:45')).toEqual([]));
});

describe('URL_SECRET', () => {
  it('captures secret query values only', () => {
    expect(texts(detectUrlSecret('see https://api.acme.com/x?id=7&token=abc123&sig=zz9'))).toEqual(['abc123', 'zz9']);
  });
  it('ignores harmless query strings', () => expect(detectUrlSecret('https://acme.com/?page=2')).toEqual([]));
});

describe('ORG_TERM', () => {
  const config = { nanoMinConfidence: 0.5, protectedTerms: [{ term: 'Project Falcon', category: 'ORG_TERM' as const }] };
  it('matches whole words, case-insensitively', () => expect(texts(detectOrgTerm('the project falcon launch', config))).toEqual(['project falcon']));
  it('does not match inside other words', () => expect(detectOrgTerm('Project Falconry', config)).toEqual([]));
});
