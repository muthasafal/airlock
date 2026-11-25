/**
 * fast-check arbitraries that build documents with planted secrets of every category in random
 * positions and formats (BRIEF §11.4). Rule categories are found by the real rule detectors;
 * contextual categories (what Gemini Nano finds) are planted as fixed Nano detector outputs.
 * All data is fictional.
 */
import fc from 'fast-check';
import type { Category, Finding, Policy } from '../../src/types.js';
import { verhoeffCheck } from '../../src/checksums/verhoeff.js';
import { luhnCheck } from '../../src/checksums/luhn.js';
import { buildPolicy, ALL_CATEGORIES } from '../../src/policy.js';

export const NUM_RUNS = 1000;

const FILLER = [
  'the', 'report', 'for', 'and', 'review', 'notes', 'draft', 'meeting', 'today', 'budget', 'update',
  'please', 'check', 'with', 'about', 'plan', 'client', 'call', 'next', 'week', 'thanks', 'regards',
  'summary', 'agenda', 'follow', 'up', 'on', 'our', 'is', 'was', 'to', 'by', 'in', 'of',
];

const PEOPLE = [
  'Priya Shah', 'Rohan Mehta', 'Ananya Iyer', 'Vikram Nair', 'Sunita Reddy', 'Arjun Kapoor',
  'Meera Joshi', 'Kabir Malhotra', 'Olivia Turner', 'Henry Walsh', 'Grace Holloway', 'Samuel Pryce',
];
const ORGS = ['Acme Corp', 'Globex Pvt Ltd', 'Initech Inc', 'Umbrella Labs', 'Hooli Technologies'];
const PLACES = ['Pune', 'Nagpur', 'Leeds', 'Ottawa', 'Kochi'];
const HEALTH = ['type 2 diabetes', 'chronic anxiety', 'stage 2 lymphoma', 'a fractured wrist'];
const LEGAL = ['divorce petition', 'wrongful termination claim', 'patent dispute'];
const PROJECTS = ['Project Bluebell', 'Project Kingfisher', 'Operation Nightjar'];
const GOV_IDS = ['K1234567', 'Z9876543', 'P4455667'];
const OTHER = ['the unannounced merger', 'the layoff list'];

const digits = (n: number) => fc.array(fc.integer({ min: 0, max: 9 }), { minLength: n, maxLength: n }).map((d) => d.join(''));
const upper = (n: number) =>
  fc.array(fc.integer({ min: 65, max: 90 }), { minLength: n, maxLength: n }).map((c) => String.fromCharCode(...c));
const alnum = (n: number) =>
  fc
    .array(fc.constantFrom(...'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'.split('')), { minLength: n, maxLength: n })
    .map((c) => c.join(''));

function withVerhoeff(body: string): string {
  for (let d = 0; d < 10; d++) if (verhoeffCheck(body + d)) return body + d;
  return body + '0';
}
function withLuhn(body: string): string {
  for (let d = 0; d < 10; d++) if (luhnCheck(body + d)) return body + d;
  return body + '0';
}

export interface Planted {
  value: string;
  category: Category;
  /** Context words that must precede the value for its detector (e.g. "account"). */
  prefix?: string;
  /** Planted as a Nano finding (contextual categories) rather than found by rules. */
  nano?: boolean;
}

const rule = (category: Category, value: fc.Arbitrary<string>, prefix?: string) =>
  value.map((v): Planted => ({ value: v, category, prefix }));
const nano = (category: Category, values: string[]) =>
  fc.constantFrom(...values).map((v): Planted => ({ value: v, category, nano: true }));

/** One planted secret of any category. */
export const plantedSecret: fc.Arbitrary<Planted> = fc.oneof(
  rule('EMAIL', fc.tuple(fc.constantFrom('priya', 'rohan', 'ops', 'm'), alnum(4), fc.constantFrom('acme.com', 'globex.in')).map(([a, b, d]) => `${a}.${b.toLowerCase()}@${d}`)),
  rule('PHONE', fc.tuple(fc.constantFrom('6', '7', '8', '9'), digits(4), digits(5), fc.constantFrom('', '+91 ', '0')).map(([a, b, c, p]) => `${p}${a}${b} ${c}`)),
  rule('AADHAAR', fc.tuple(fc.integer({ min: 2, max: 9 }), digits(10)).map(([a, b]) => withVerhoeff(`${a}${b}`)).map((d) => `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}`)),
  rule('PAN', fc.tuple(upper(3), fc.constantFrom('P', 'C', 'H'), upper(1), digits(4), upper(1)).map((p) => p.join(''))),
  rule('IFSC', fc.tuple(upper(4), digits(6)).map(([a, b]) => `${a}0${b}`)),
  rule('BANK_ACCOUNT', digits(12).map((d) => `1${d.slice(1)}`), 'account number'),
  rule('CARD', fc.tuple(fc.constantFrom('4', '5'), digits(14)).map(([a, b]) => withLuhn(a + b)).map((d) => d.match(/.{1,4}/g)!.join(' '))),
  rule('UPI', fc.tuple(fc.constantFrom('rohan', 'meera', 'pay'), digits(3), fc.constantFrom('okaxis', 'ybl', 'oksbi')).map(([a, b, c]) => `${a}${b}@${c}`)),
  rule('API_KEY', alnum(28).map((s) => `sk-ant-${s}`), 'key'),
  rule('JWT', fc.tuple(alnum(12), alnum(16), alnum(20)).map(([a, b, c]) => `eyJ${a}.${b}.${c}`)),
  rule('PRIVATE_KEY', alnum(40).map((s) => `-----BEGIN PRIVATE KEY-----\n${s}\n-----END PRIVATE KEY-----`)),
  rule('PASSWORD', alnum(10).map((s) => `password: ${s}`)),
  rule('IP_ADDRESS', fc.tuple(fc.integer({ min: 11, max: 99 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 1, max: 254 })).map((o) => o.join('.'))),
  rule('URL_SECRET', alnum(18).map((s) => `https://api.globex.in/v1/data?token=${s}`)),
  nano('PERSON', PEOPLE),
  nano('ORG', ORGS),
  nano('LOCATION', PLACES),
  nano('HEALTH', HEALTH),
  nano('FINANCIAL_AMOUNT', ['₹4,52,317', '$18,240', '₹2.37 crore']),
  nano('LEGAL_MATTER', LEGAL),
  nano('INTERNAL_PROJECT', PROJECTS),
  nano('GOVERNMENT_ID', GOV_IDS),
  nano('DATE_OF_BIRTH', ['14/03/1992', '1987-11-02']),
  nano('CREDENTIAL', ['vault master phrase']),
  nano('OTHER_SENSITIVE', OTHER),
);

export interface Doc {
  text: string;
  planted: Array<Planted & { start: number; end: number }>;
  /** The Nano detector output for this document (contextual findings, all occurrences). */
  nanoFindings: Finding[];
}

/** A document: filler words with 1 to 6 planted secrets at random positions. */
export const doc: fc.Arbitrary<Doc> = fc
  .tuple(
    fc.array(fc.array(fc.constantFrom(...FILLER), { minLength: 1, maxLength: 5 }), { minLength: 2, maxLength: 7 }),
    fc.array(plantedSecret, { minLength: 1, maxLength: 6 }),
  )
  .map(([fillers, secrets]) => {
    let text = '';
    const planted: Doc['planted'] = [];
    fillers.forEach((words, i) => {
      text += (text ? ' ' : '') + words.join(' ');
      const s = secrets[i];
      if (s) {
        text += ' ' + (s.prefix ? `${s.prefix} ` : '');
        const raw = s.category === 'PASSWORD' ? s.value.slice('password: '.length) : s.value;
        const lead = s.category === 'PASSWORD' ? 'password: ' : '';
        text += lead;
        planted.push({ ...s, value: raw, start: text.length, end: text.length + raw.length });
        text += raw + ' .';
      }
    });
    for (const s of secrets.slice(fillers.length)) {
      text += ' ' + (s.prefix ? `${s.prefix} ` : '');
      const raw = s.category === 'PASSWORD' ? s.value.slice('password: '.length) : s.value;
      text += s.category === 'PASSWORD' ? 'password: ' : '';
      planted.push({ ...s, value: raw, start: text.length, end: text.length + raw.length });
      text += raw + ' .';
    }
    const nanoFindings: Finding[] = [];
    for (const p of planted.filter((x) => x.nano)) {
      let from = 0;
      let at: number;
      while ((at = text.indexOf(p.value, from)) >= 0) {
        nanoFindings.push({ start: at, end: at + p.value.length, text: p.value, category: p.category, detector: 'NANO', confidence: 0.9 });
        from = at + p.value.length;
      }
    }
    return { text, planted, nanoFindings };
  });

export const seed = fc.integer({ min: 1, max: 0x7fffffff });

/** Default policy (BRIEF §8.3), plus an org protected term. */
export const defaultPolicy: Policy = buildPolicy({}, [{ term: 'Project Falcon', category: 'ORG_TERM', action: 'PSEUDONYMIZE' }]);

/** Every category set to PSEUDONYMIZE (for the round-trip invariant). */
export const pseudonymizeAll: Policy = buildPolicy({
  userSettings: Object.fromEntries(ALL_CATEGORIES.map((c) => [c, 'PSEUDONYMIZE'])),
});
