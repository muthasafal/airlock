import type { Category, SessionMapping, StandInGenerator } from './types.js';
import { luhnCheck } from './checksums/luhn.js';
import { verhoeffCheck } from './checksums/verhoeff.js';
import { formatAmount, parseAmount, roundToBand } from './generalize.js';
import indianFirst from './pools/indian-first-names.json' with { type: 'json' };
import indianSurnames from './pools/indian-surnames.json' with { type: 'json' };
import westernFirst from './pools/western-first-names.json' with { type: 'json' };
import westernSurnames from './pools/western-surnames.json' with { type: 'json' };
import companies from './pools/company-names.json' with { type: 'json' };
import cities from './pools/cities.json' with { type: 'json' };
import codenames from './pools/codenames.json' with { type: 'json' };
import upiHandles from './pools/upi-handles.json' with { type: 'json' };

/** Stand-in pools (BRIEF §8.2), exported for tests. */
export const POOLS = {
  indianFirst: indianFirst as { female: string[]; male: string[] },
  indianSurnames: indianSurnames as string[],
  westernFirst: westernFirst as { female: string[]; male: string[] },
  westernSurnames: westernSurnames as string[],
  companies: companies as { bases: string[]; suffixes: string[]; famousBrandBlocklist: string[] },
  cities: cities as { india: string[]; global: string[] },
  codenames: codenames as string[],
  upiHandles: upiHandles as string[],
};

const lowerSet = (xs: string[]) => new Set(xs.map((x) => x.toLowerCase()));
const INDIAN_FIRST = lowerSet([...POOLS.indianFirst.female, ...POOLS.indianFirst.male]);
const INDIAN_FEMALE = lowerSet(POOLS.indianFirst.female);
const WESTERN_FEMALE = lowerSet(POOLS.westernFirst.female);
const INDIAN_SURNAME = lowerSet(POOLS.indianSurnames);
const INDIAN_CITY = lowerSet(POOLS.cities.india);

const TITLE = /^(mr|mrs|ms|miss|mx|dr|prof|shri|smt|sri|sir|madam)\.?$/i;
const ORG_SUFFIX =
  /\s+(pvt\.?\s+ltd\.?|private\s+limited|ltd\.?|limited|inc\.?|corp\.?|corporation|llc|llp|labs|technologies|tech|group|co\.?|company|solutions|systems)$/i;
const ROLE_LOCALS = new Set(
  'info support admin hr contact sales hello team noreply no-reply careers jobs billing accounts office mail help security privacy legal press'.split(' '),
);
const FREE_MAIL = /^(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|icloud|me|proton|protonmail|rediffmail|aol|zoho)\./i;

/** Creates an empty session mapping. The seed (a random 32-bit value kept in the vault) drives every draw. */
export function createSessionMapping(seed: number): SessionMapping {
  return {
    forward: new Map(),
    reverse: new Map(),
    aliases: new Map(),
    aliasForward: new Map(),
    originals: new Set(),
    seed: seed >>> 0,
  };
}

/** mulberry32 PRNG. BRIEF §8.2. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit hash, used to derive an independent PRNG stream per (seed, category, original, attempt). */
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

type Rng = () => number;
const rngFor = (seed: number, ...parts: Array<string | number>) => mulberry32(fnv1a(`${seed}|${parts.join('|')}`));
const pick = <T>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];
const digit = (rng: Rng) => String(Math.floor(rng() * 10));
const letter = (rng: Rng) => String.fromCharCode(65 + Math.floor(rng() * 26));

/** Copies the case style of `occurrence` onto `standIn` (UPPER, lower or as generated). */
export function transferCase(occurrence: string, standIn: string): string {
  const letters = occurrence.replace(/[^\p{L}]/gu, '');
  if (letters.length > 1 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) return standIn.toUpperCase();
  if (letters.length > 1 && letters === letters.toLowerCase() && letters !== letters.toUpperCase()) return standIn.toLowerCase();
  return standIn;
}

/** Writes new digits into the digit positions of `format`, keeping spaces, dashes and other characters. */
function fillDigits(format: string, digits: string): string {
  let i = 0;
  return format.replace(/\d/g, () => digits[i++] ?? '0');
}

/** Lower-cased originals plus every stand-in already issued in the session. */
function taken(mapping: SessionMapping): { originals: string[]; standIns: Set<string> } {
  return {
    originals: [...mapping.originals].map((o) => o.toLowerCase()),
    standIns: new Set([...mapping.reverse.keys(), ...mapping.aliases.keys()].map((s) => s.toLowerCase())),
  };
}

/**
 * Collision check (BRIEF §8.2): a candidate must not appear inside any original text or value
 * of the session, must not contain an original value, and must not already be another stand-in.
 */
export function isFree(candidate: string, mapping: SessionMapping, allowSameAs?: string): boolean {
  const c = candidate.toLowerCase();
  if (!c.trim()) return false;
  const t = taken(mapping);
  if (t.standIns.has(c)) {
    const owner = mapping.reverse.get(candidate) ?? mapping.aliases.get(candidate);
    if (!(allowSameAs && owner && owner.toLowerCase() === allowSameAs.toLowerCase())) return false;
  }
  for (const o of t.originals) {
    if (!o) continue;
    if (o.includes(c)) return false;
    if (o.length >= 3 && c.includes(o) && !o.includes(' ') && o.length < 40) return false;
  }
  return true;
}

/** Draws a value up to 20 times until it is free, then falls back to `CATEGORY_n`. BRIEF §8.2. */
function draw(
  mapping: SessionMapping,
  category: Category,
  original: string,
  make: (rng: Rng, attempt: number) => string,
): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = make(rngFor(mapping.seed, category, original.toLowerCase(), attempt), attempt);
    if (isFree(candidate, mapping)) return candidate;
  }
  let n = mapping.reverse.size + 1;
  while (!isFree(`${category}_${n}`, mapping)) n++;
  return `${category}_${n}`;
}

/** Records a forward + reverse pair. */
function register(mapping: SessionMapping, original: string, standIn: string): void {
  mapping.forward.set(original.toLowerCase(), standIn);
  if (!mapping.reverse.has(standIn)) mapping.reverse.set(standIn, original);
}

function registerAlias(mapping: SessionMapping, originalPart: string, standInPart: string): void {
  const key = originalPart.toLowerCase();
  if (!mapping.aliasForward.has(key)) mapping.aliasForward.set(key, standInPart);
  if (!mapping.aliases.has(standInPart)) mapping.aliases.set(standInPart, originalPart);
}

/** A name part (first / middle / last) for PERSON, reusing an earlier alias for the same original part. */
function namePart(
  mapping: SessionMapping,
  part: string,
  role: 'first' | 'last',
  indian: boolean,
  female: boolean,
): string {
  const known = mapping.aliasForward.get(part.toLowerCase());
  if (known) return known;
  const pool =
    role === 'last'
      ? indian
        ? POOLS.indianSurnames
        : POOLS.westernSurnames
      : indian
        ? female ? POOLS.indianFirst.female : POOLS.indianFirst.male
        : female ? POOLS.westernFirst.female : POOLS.westernFirst.male;
  const chosen = draw(mapping, 'PERSON', `${role}:${part}`, (rng) => pick(rng, pool));
  registerAlias(mapping, part, chosen);
  return chosen;
}

function personStandIn(original: string, mapping: SessionMapping): string {
  const tokens = original.trim().split(/\s+/);
  const titles = tokens.filter((t) => TITLE.test(t));
  const parts = tokens.filter((t) => !TITLE.test(t));
  if (parts.length === 0) return original;
  const first = parts[0].toLowerCase();
  const last = parts[parts.length - 1].toLowerCase();
  const indian = INDIAN_SURNAME.has(last) || INDIAN_FIRST.has(first);
  const female = INDIAN_FEMALE.has(first) || WESTERN_FEMALE.has(first) || (!INDIAN_FIRST.has(first) && fnv1a(first) % 2 === 0);
  const out = parts.map((p, i) =>
    namePart(mapping, p, parts.length > 1 && i === parts.length - 1 ? 'last' : 'first', indian, female),
  );
  return [...titles, ...out].join(' ');
}

function orgStandIn(original: string, mapping: SessionMapping): string {
  const trimmed = original.trim();
  const suffix = trimmed.match(ORG_SUFFIX)?.[0] ?? '';
  const base = suffix ? trimmed.slice(0, -suffix.length) : trimmed;
  let newBase = mapping.aliasForward.get(base.toLowerCase());
  if (!newBase) {
    newBase = draw(mapping, 'ORG', base, (rng) => pick(rng, POOLS.companies.bases));
    registerAlias(mapping, base, newBase);
  }
  return newBase + suffix;
}

function emailStandIn(original: string, mapping: SessionMapping): string {
  const [local, domain = 'example.com'] = original.split('@');
  let newLocal = local;
  if (!ROLE_LOCALS.has(local.toLowerCase())) {
    const seps = local.match(/[._-]/g) ?? [];
    const words = local.split(/[._-]/).filter(Boolean);
    const alpha = words.filter((w) => /^[A-Za-z]+$/.test(w));
    if (alpha.length > 0) {
      const person = personStandIn(alpha.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' '), mapping).split(' ');
      let pi = 0;
      const rng = rngFor(mapping.seed, 'EMAIL-LOCAL', local.toLowerCase());
      const mapped = words.map((w) => (/^[A-Za-z]+$/.test(w) ? person[pi++].toLowerCase() : w.replace(/\d/g, () => digit(rng))));
      newLocal = mapped.reduce((acc, w, i) => acc + (i > 0 ? seps[i - 1] ?? '.' : '') + w, '');
    } else {
      const rng = rngFor(mapping.seed, 'EMAIL-LOCAL', local.toLowerCase());
      newLocal = local.replace(/\d/g, () => digit(rng)).replace(/[A-Za-z]/g, () => letter(rng).toLowerCase());
    }
  }
  const domainKey = `domain:${domain.toLowerCase()}`;
  let newDomain = mapping.aliasForward.get(domainKey);
  if (!newDomain) {
    newDomain = FREE_MAIL.test(domain)
      ? 'mail.example'
      : draw(mapping, 'EMAIL', domain, (rng) => `${pick(rng, POOLS.companies.bases).toLowerCase()}.example`);
    mapping.aliasForward.set(domainKey, newDomain);
  }
  const candidate = `${newLocal}@${newDomain}`;
  if (isFree(candidate, mapping)) return candidate;
  return draw(mapping, 'EMAIL', original, (rng, attempt) => `${newLocal}${attempt + 1 + Math.floor(rng() * 9)}@${newDomain}`);
}

function phoneStandIn(original: string, mapping: SessionMapping): string {
  const digits = original.replace(/\D/g, '');
  return draw(mapping, 'PHONE', original, (rng) => {
    let lead = '';
    let main = digits;
    if (digits.length >= 10) {
      lead = digits.slice(0, digits.length - 10);
      main = digits.slice(-10);
    }
    let fake: string;
    if (main.length === 10) {
      // Indian-style: starts with 9 and ends in a 0000x block, so it reads as obviously fictional.
      fake = '9' + Array.from({ length: 4 }, () => digit(rng)).join('') + '0000' + digit(rng);
    } else {
      const keep = original.trim().startsWith('+') ? Math.min(3, Math.max(1, main.length - 6)) : 0;
      const rest = main.length - keep;
      const body = Array.from({ length: Math.max(0, rest - 5) }, () => digit(rng)).join('');
      fake = main.slice(0, keep) + body + ('0000' + digit(rng)).slice(-Math.min(5, rest));
    }
    return fillDigits(original, lead + fake);
  });
}

/** 12-digit Aadhaar-shaped number that fails Verhoeff (never a real ID). BRIEF §8.2. */
function aadhaarStandIn(original: string, mapping: SessionMapping): string {
  return draw(mapping, 'AADHAAR', original, (rng) => {
    let d = String(2 + Math.floor(rng() * 8)) + Array.from({ length: 10 }, () => digit(rng)).join('');
    for (let last = 0; last < 10; last++) {
      if (!verhoeffCheck(d + last)) {
        d += last;
        break;
      }
    }
    return fillDigits(original, d);
  });
}

/** Card number with the same length and grouping that fails Luhn. BRIEF §8.2. */
function cardStandIn(original: string, mapping: SessionMapping): string {
  const n = original.replace(/\D/g, '').length;
  return draw(mapping, 'CARD', original, (rng) => {
    let d = original.replace(/\D/g, '')[0] + Array.from({ length: n - 2 }, () => digit(rng)).join('');
    for (let last = 0; last < 10; last++) {
      if (!luhnCheck(d + last)) {
        d += last;
        break;
      }
    }
    return fillDigits(original, d);
  });
}

/** Character-shape-preserving random replacement (letters to letters, digits to digits). */
function shapeStandIn(original: string, mapping: SessionMapping, category: Category): string {
  return draw(mapping, category, original, (rng) =>
    original
      .replace(/\d/g, () => digit(rng))
      .replace(/[A-Z]/g, () => letter(rng))
      .replace(/[a-z]/g, () => letter(rng).toLowerCase()),
  );
}

function panStandIn(original: string, mapping: SessionMapping): string {
  // 4th character "X" is not a valid PAN holder type, so the fake can never be a real PAN.
  return draw(mapping, 'PAN', original, (rng) => {
    const l = () => letter(rng);
    return `${l()}${l()}${l()}X${l()}${digit(rng)}${digit(rng)}${digit(rng)}${digit(rng)}${l()}`;
  });
}

function ifscStandIn(original: string, mapping: SessionMapping): string {
  return draw(mapping, 'IFSC', original, (rng) => `${letter(rng)}${letter(rng)}${letter(rng)}${letter(rng)}0${Array.from({ length: 6 }, () => digit(rng)).join('')}`);
}

function upiStandIn(original: string, mapping: SessionMapping): string {
  const [local] = original.split('@');
  return draw(mapping, 'UPI', original, (rng) => {
    const name = pick(rng, [...POOLS.westernFirst.female, ...POOLS.indianFirst.male]).toLowerCase();
    const num = /\d/.test(local) ? String(Math.floor(rng() * 900) + 100) : '';
    return `${name}${num}@${pick(rng, POOLS.upiHandles)}`;
  });
}

function ipStandIn(original: string, mapping: SessionMapping): string {
  if (original.includes(':')) {
    return draw(mapping, 'IP_ADDRESS', original, (rng) => `2001:db8::${Math.floor(rng() * 0xffff).toString(16)}`);
  }
  // RFC 5737 documentation ranges: never routable, always fictional.
  const nets = ['192.0.2', '198.51.100', '203.0.113'];
  return draw(mapping, 'IP_ADDRESS', original, (rng) => `${pick(rng, nets)}.${1 + Math.floor(rng() * 254)}`);
}

function locationStandIn(original: string, mapping: SessionMapping): string {
  // Same country: Indian places (known cities or typical suffixes) get an Indian city.
  const name = original.trim().toLowerCase();
  const indian =
    INDIAN_CITY.has(name) ||
    /(mumbai|delhi|bengaluru|bangalore|chennai|kolkata|hyderabad|ahmedabad|pur|bad|nagar|garh|pet|wadi|abad|ore)$/.test(name);
  const pool = indian ? POOLS.cities.india : POOLS.cities.global;
  return draw(mapping, 'LOCATION', original, (rng) => pick(rng, pool));
}

function codenameStandIn(original: string, mapping: SessionMapping, category: Category): string {
  const prefix = original.match(/^(project|operation|programme|program|initiative)\s+/i)?.[0] ?? '';
  return draw(mapping, category, original, (rng) => {
    const name = pick(rng, POOLS.codenames);
    return prefix ? prefix + name.split(' ')[1] : name;
  });
}

/** Session-constant shift of ±(1..30) days for DATE_OF_BIRTH pseudonyms. */
function dateStandIn(original: string, mapping: SessionMapping): string {
  const offset = ((mapping.seed % 30) + 1) * (mapping.seed % 2 === 0 ? 1 : -1);
  const dmy = original.match(/^(\d{1,2})([/.-])(\d{1,2})\2(\d{4})$/);
  const ymd = original.match(/^(\d{4})([/.-])(\d{1,2})\2(\d{1,2})$/);
  const pad = (n: number) => String(n).padStart(2, '0');
  const shift = (y: number, m: number, d: number) => {
    const t = new Date(Date.UTC(y, m - 1, d) + offset * 86400000);
    return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()] as const;
  };
  let candidate: string | null = null;
  if (dmy) {
    const [y, m, d] = shift(+dmy[4], +dmy[3], +dmy[1]);
    candidate = `${pad(d)}${dmy[2]}${pad(m)}${dmy[2]}${y}`;
  } else if (ymd) {
    const [y, m, d] = shift(+ymd[1], +ymd[3], +ymd[4]);
    candidate = `${y}${ymd[2]}${pad(m)}${ymd[2]}${pad(d)}`;
  }
  if (candidate && isFree(candidate, mapping)) return candidate;
  return shapeStandIn(original, mapping, 'DATE_OF_BIRTH');
}

function amountStandIn(original: string, mapping: SessionMapping): string {
  const parsed = parseAmount(original);
  if (!parsed || parsed.value === 0) return shapeStandIn(original, mapping, 'FINANCIAL_AMOUNT');
  return draw(mapping, 'FINANCIAL_AMOUNT', original, (_rng, attempt) => {
    // A session-constant scale factor (0.8 to 1.25), nudged per attempt to stay unique.
    const factor = 0.8 + (mapping.seed % 1000) / 2222 + attempt * 0.013;
    return formatAmount(parsed.currency, roundToBand(parsed.value * factor));
  });
}

/** Numbered placeholder such as ‹secret-1›, reused for the same original. */
export function placeholder(kind: string, original: string, mapping: SessionMapping): string {
  const existing = mapping.forward.get(original.toLowerCase());
  if (existing && existing.startsWith(`‹${kind}-`)) return existing;
  let n = 1;
  for (const k of mapping.reverse.keys()) if (k.startsWith(`‹${kind}-`)) n++;
  while (mapping.reverse.has(`‹${kind}-${n}›`)) n++;
  const p = `‹${kind}-${n}›`;
  register(mapping, original, p);
  return p;
}

/**
 * Creates a seeded stand-in generator. The seed is stored in the vault per session.
 * Every draw uses mulberry32 seeded from (session seed, category, original, attempt), so the
 * result is deterministic and independent of call order. Implements BRIEF §8.2: region and
 * shape preservation, aliases, checksum-invalid fakes, collision re-draws and numbered fallback.
 */
export function createStandInGenerator(seed: number): StandInGenerator {
  return {
    generate(original: string, category: Category, mapping: SessionMapping): string {
      if (mapping.seed !== seed >>> 0) mapping.seed = seed >>> 0;
      const existing = mapping.forward.get(original.toLowerCase());
      if (existing) return existing;
      let standIn: string;
      switch (category) {
        case 'PERSON':
          standIn = personStandIn(original, mapping);
          break;
        case 'ORG':
          standIn = orgStandIn(original, mapping);
          break;
        case 'EMAIL':
          standIn = emailStandIn(original, mapping);
          break;
        case 'PHONE':
          standIn = phoneStandIn(original, mapping);
          break;
        case 'AADHAAR':
          standIn = aadhaarStandIn(original, mapping);
          break;
        case 'CARD':
          standIn = cardStandIn(original, mapping);
          break;
        case 'PAN':
          standIn = panStandIn(original, mapping);
          break;
        case 'IFSC':
          standIn = ifscStandIn(original, mapping);
          break;
        case 'UPI':
          standIn = upiStandIn(original, mapping);
          break;
        case 'IP_ADDRESS':
          standIn = ipStandIn(original, mapping);
          break;
        case 'LOCATION':
          standIn = locationStandIn(original, mapping);
          break;
        case 'INTERNAL_PROJECT':
        case 'ORG_TERM':
          standIn = codenameStandIn(original, mapping, category);
          break;
        case 'DATE_OF_BIRTH':
          standIn = dateStandIn(original, mapping);
          break;
        case 'FINANCIAL_AMOUNT':
          standIn = amountStandIn(original, mapping);
          break;
        case 'BANK_ACCOUNT':
        case 'GOVERNMENT_ID':
          standIn = shapeStandIn(original, mapping, category);
          break;
        case 'HEALTH':
        case 'LEGAL_MATTER':
        case 'OTHER_SENSITIVE':
        case 'CREDENTIAL':
        case 'API_KEY':
        case 'JWT':
        case 'PRIVATE_KEY':
        case 'PASSWORD':
        case 'URL_SECRET':
        default:
          return placeholder('detail', original, mapping);
      }
      if (!isFree(standIn, mapping, original)) {
        // Composite stand-ins (names, emails) are built from reused parts; keep the whole unique.
        const base = standIn;
        standIn = draw(mapping, category, `${original}#full`, (_rng, attempt) => `${base} ${attempt + 2}`);
      }
      register(mapping, original, standIn);
      return standIn;
    },
  };
}
