import {
  buildPolicy,
  createSessionMapping,
  detectRules,
  luhnCheck,
  mulberry32,
  scrubWithFindings,
  verhoeffCheck,
  type Category,
  type Finding,
} from '@airlock/scrub-engine';
import { NanoDetector } from '@airlock/nano-detector';
import { getNanoModels } from '../firebase/ai';
import { getRemoteConfigValues } from '../firebase/remoteConfig';

/**
 * Leak benchmark (BRIEF §P1-2). A deterministic, seeded generator produces synthetic documents
 * (emails, chat logs, code, medical notes, contracts) with planted ground-truth secrets, all
 * fictional. Three configurations run in the user's own Chrome: no protection, rules only, and
 * rules + Gemini Nano (full Airlock). Per category we report recall, precision, leaked count and
 * average latency per document. Nothing leaves the device.
 */

export type BenchConfig = 'none' | 'rules' | 'rules+nano';

export interface Planted {
  value: string;
  category: Category;
}

export interface BenchDoc {
  kind: 'email' | 'chat' | 'code' | 'medical' | 'contract';
  text: string;
  planted: Planted[];
}

export interface CategoryResult {
  category: Category;
  planted: number;
  caught: number;
  leaked: number;
  recall: number;
  precision: number | null;
}

export interface ConfigResult {
  config: BenchConfig;
  available: boolean;
  avgLatencyMs: number;
  categories: CategoryResult[];
  totalPlanted: number;
  totalLeaked: number;
}

export interface BenchReport {
  seed: number;
  documents: number;
  ranAt: string;
  userAgent: string;
  results: ConfigResult[];
}

const PEOPLE = ['Priya Shah', 'Rohan Mehta', 'Ananya Iyer', 'Vikram Nair', 'Sunita Reddy', 'Kabir Malhotra', 'Olivia Turner', 'Henry Walsh', 'Grace Holloway', 'Meera Joshi'];
const ORGS = ['Acme Corp', 'Globex Pvt Ltd', 'Initech Inc', 'Umbrella Labs', 'Hooli Technologies', 'Stark Freight'];
const PLACES = ['Pune', 'Nagpur', 'Kochi', 'Leeds', 'Ottawa', 'Indore'];
const HEALTH = ['type 2 diabetes', 'chronic anxiety', 'stage 2 lymphoma', 'hypertension', 'a fractured wrist'];
const LEGAL = ['divorce petition', 'wrongful termination claim', 'patent dispute', 'cheque bounce case'];
const PROJECTS = ['Project Bluebell', 'Project Kingfisher', 'Operation Nightjar', 'Project Saffron'];

type Rng = () => number;
const pick = <T,>(r: Rng, xs: T[]): T => xs[Math.floor(r() * xs.length)];
const digits = (r: Rng, n: number) => Array.from({ length: n }, () => Math.floor(r() * 10)).join('');
const letters = (r: Rng, n: number) => Array.from({ length: n }, () => String.fromCharCode(65 + Math.floor(r() * 26))).join('');
const alnum = (r: Rng, n: number) => {
  const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: n }, () => a[Math.floor(r() * a.length)]).join('');
};
const withCheck = (body: string, ok: (s: string) => boolean) => {
  for (let d = 0; d < 10; d++) if (ok(body + d)) return body + d;
  return body + '0';
};

const gen = {
  PERSON: (r: Rng) => pick(r, PEOPLE),
  ORG: (r: Rng) => pick(r, ORGS),
  LOCATION: (r: Rng) => pick(r, PLACES),
  HEALTH: (r: Rng) => pick(r, HEALTH),
  LEGAL_MATTER: (r: Rng) => pick(r, LEGAL),
  INTERNAL_PROJECT: (r: Rng) => pick(r, PROJECTS),
  FINANCIAL_AMOUNT: (r: Rng) => `₹${Math.floor(1 + r() * 9)},${digits(r, 2)},${digits(r, 3)}`,
  DATE_OF_BIRTH: (r: Rng) => `${String(1 + Math.floor(r() * 28)).padStart(2, '0')}/${String(1 + Math.floor(r() * 12)).padStart(2, '0')}/19${60 + Math.floor(r() * 40)}`,
  EMAIL: (r: Rng) => `${pick(r, ['priya', 'rohan', 'ops', 'hr'])}.${alnum(r, 4).toLowerCase()}@${pick(r, ['acme.com', 'globex.in', 'initech.io'])}`,
  PHONE: (r: Rng) => `${pick(r, ['', '+91 '])}9${digits(r, 4)} ${digits(r, 5)}`,
  AADHAAR: (r: Rng) => {
    const d = withCheck(`${2 + Math.floor(r() * 8)}${digits(r, 10)}`, verhoeffCheck);
    return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}`;
  },
  PAN: (r: Rng) => `${letters(r, 3)}P${letters(r, 1)}${digits(r, 4)}${letters(r, 1)}`,
  IFSC: (r: Rng) => `${letters(r, 4)}0${digits(r, 6)}`,
  BANK_ACCOUNT: (r: Rng) => `1${digits(r, 11)}`,
  CARD: (r: Rng) => withCheck(`4${digits(r, 14)}`, luhnCheck).match(/.{1,4}/g)!.join(' '),
  UPI: (r: Rng) => `${pick(r, ['rohan', 'meera', 'kabir'])}${digits(r, 2)}@${pick(r, ['okaxis', 'ybl', 'oksbi'])}`,
  API_KEY: (r: Rng) => `sk-ant-${alnum(r, 28)}`,
  JWT: (r: Rng) => `eyJ${alnum(r, 14)}.${alnum(r, 18)}.${alnum(r, 22)}`,
  PASSWORD: (r: Rng) => `${alnum(r, 6)}#${digits(r, 3)}`,
  IP_ADDRESS: (r: Rng) => `10.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}.${1 + Math.floor(r() * 250)}`,
  URL_SECRET: (r: Rng) => alnum(r, 20),
};

type Slot = keyof typeof gen;

const TEMPLATES: Array<{ kind: BenchDoc['kind']; text: string }> = [
  { kind: 'email', text: 'Hi {PERSON}, please transfer {FINANCIAL_AMOUNT} to account {BANK_ACCOUNT} (IFSC {IFSC}) before Friday. Call me on {PHONE} or write to {EMAIL}. Thanks, {PERSON} at {ORG}.' },
  { kind: 'email', text: 'Dear team, {PERSON} from {ORG} will visit our {LOCATION} office next week to discuss {INTERNAL_PROJECT}. Please keep this quiet until the announcement.' },
  { kind: 'chat', text: '[10:02] {PERSON}: the {INTERNAL_PROJECT} launch moved to {LOCATION}.\n[10:03] {PERSON}: noted. Send the advance to my UPI {UPI}, and my number is {PHONE}.' },
  { kind: 'code', text: "const client = new Api({ apiKey: '{API_KEY}' });\n// staging box {IP_ADDRESS}\nfetch('https://api.globex.in/v2/report?token={URL_SECRET}');\n// db password: {PASSWORD}\nconst session = '{JWT}';" },
  { kind: 'medical', text: 'Patient {PERSON}, DOB {DATE_OF_BIRTH}, Aadhaar {AADHAAR}, was seen in {LOCATION} for {HEALTH}. Insurance card {CARD}. Follow up with {ORG}.' },
  { kind: 'contract', text: 'This agreement between {ORG} and {PERSON} (PAN {PAN}) settles the {LEGAL_MATTER}. The fee of {FINANCIAL_AMOUNT} is payable to account {BANK_ACCOUNT}.' },
];

/** Deterministic document generator: same seed, same documents. */
export function generateDocuments(n: number, seed: number): BenchDoc[] {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const t = pick(r, TEMPLATES);
    const planted: Planted[] = [];
    const text = t.text.replace(/\{([A-Z_]+)\}/g, (_m, slot: Slot) => {
      const value = gen[slot](r);
      planted.push({ value, category: slot as Category });
      return value;
    });
    return { kind: t.kind, text, planted };
  });
}

const overlaps = (f: Finding, text: string, value: string) => {
  const at = text.indexOf(value);
  return at >= 0 && f.start < at + value.length && at < f.end;
};

/** Runs one configuration over the documents and scores it per category. */
export async function runConfig(docs: BenchDoc[], config: BenchConfig, onProgress?: (done: number) => void): Promise<ConfigResult> {
  const models = getNanoModels();
  const nano = config === 'rules+nano' && models ? new NanoDetector(models.detect, { timeoutMs: 8000, chunkChars: getRemoteConfigValues().chunk_chars }) : null;
  if (config === 'rules+nano' && !nano) {
    return { config, available: false, avgLatencyMs: 0, categories: [], totalPlanted: 0, totalLeaked: 0 };
  }
  const policy = buildPolicy({});
  const stats = new Map<Category, { planted: number; caught: number; leaked: number; tp: number; fp: number }>();
  const stat = (c: Category) => {
    if (!stats.has(c)) stats.set(c, { planted: 0, caught: 0, leaked: 0, tp: 0, fp: 0 });
    return stats.get(c)!;
  };
  let totalMs = 0;
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    const t0 = performance.now();
    let outbound = d.text;
    let findings: Finding[] = [];
    if (config !== 'none') {
      const raw = detectRules(d.text);
      if (nano) {
        try {
          raw.push(...(await nano.detect(d.text, { nanoMinConfidence: getRemoteConfigValues().nano_min_confidence })));
        } catch {
          /* counts as a miss */
        }
      }
      const r = scrubWithFindings(d.text, raw, createSessionMapping(1000 + i), policy);
      outbound = r.text;
      findings = r.findings;
    }
    totalMs += performance.now() - t0;
    const lower = outbound.toLowerCase();
    for (const p of d.planted) {
      const s = stat(p.category);
      s.planted++;
      if (lower.includes(p.value.toLowerCase())) s.leaked++;
      else s.caught++;
    }
    for (const f of findings) {
      const hit = d.planted.find((p) => overlaps(f, d.text, p.value));
      const s = stat(hit ? hit.category : f.category);
      if (hit) s.tp++;
      else s.fp++;
    }
    onProgress?.(i + 1);
  }
  const categories = [...stats.entries()]
    .filter(([, s]) => s.planted > 0)
    .map(([category, s]) => ({
      category,
      planted: s.planted,
      caught: s.caught,
      leaked: s.leaked,
      recall: s.caught / s.planted,
      precision: s.tp + s.fp > 0 ? s.tp / (s.tp + s.fp) : null,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
  return {
    config,
    available: true,
    avgLatencyMs: totalMs / docs.length,
    categories,
    totalPlanted: categories.reduce((a, c) => a + c.planted, 0),
    totalLeaked: categories.reduce((a, c) => a + c.leaked, 0),
  };
}

/** Runs all three configurations and returns a JSON-ready report. */
export async function runBenchmark(n: number, seed: number, onProgress?: (label: string, done: number) => void): Promise<BenchReport> {
  const docs = generateDocuments(n, seed);
  const results: ConfigResult[] = [];
  for (const config of ['none', 'rules', 'rules+nano'] as BenchConfig[]) {
    results.push(await runConfig(docs, config, (done) => onProgress?.(config, done)));
  }
  const report = { seed, documents: n, ranAt: new Date().toISOString(), userAgent: navigator.userAgent, results };
  try {
    localStorage.setItem('airlock-bench-last', JSON.stringify(report));
  } catch {
    /* ignore */
  }
  return report;
}

export function lastReport(): BenchReport | null {
  try {
    const raw = localStorage.getItem('airlock-bench-last');
    return raw ? (JSON.parse(raw) as BenchReport) : null;
  } catch {
    return null;
  }
}
