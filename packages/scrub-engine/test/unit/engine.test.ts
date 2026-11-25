import { describe, it, expect } from 'vitest';
import { mergeFindings } from '../../src/merge.js';
import { resolveAction, buildPolicy, DEFAULT_POLICY } from '../../src/policy.js';
import { createSessionMapping, createStandInGenerator, POOLS } from '../../src/stand-ins.js';
import { generalize } from '../../src/generalize.js';
import { restore, createStreamingRestoreBuffer } from '../../src/restore.js';
import { scrubWithFindings, scrub } from '../../src/scrub.js';
import { detectRules, rulesDetector } from '../../src/detectors/index.js';
import { luhnCheck } from '../../src/checksums/luhn.js';
import type { Finding } from '../../src/types.js';

const f = (start: number, text: string, category: Finding['category'], detector: Finding['detector'] = 'RULE', confidence = 1): Finding => ({
  start, end: start + text.length, text, category, detector, confidence,
});
const cfg = { nanoMinConfidence: 0.5 };

describe('merge (Layer C)', () => {
  it('drops Nano findings below the confidence threshold', () => {
    expect(mergeFindings([f(0, 'Priya', 'PERSON', 'NANO', 0.3)], cfg)).toEqual([]);
  });
  it('prefers the longer span and covers the union', () => {
    const out = mergeFindings([f(0, 'Priya', 'PERSON', 'NANO', 0.9), f(0, 'Priya Shah', 'PERSON', 'NANO', 0.9)], cfg);
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe('Priya Shah');
  });
  it('at equal length, rules beat Nano for structured types and Nano beats rules for PERSON', () => {
    expect(mergeFindings([f(0, 'a@b.co', 'EMAIL'), f(0, 'a@b.co', 'OTHER_SENSITIVE', 'NANO', 0.9)], cfg)[0].category).toBe('EMAIL');
    expect(mergeFindings([f(0, 'Acme', 'ORG_TERM'), f(0, 'Acme', 'ORG', 'NANO', 0.9)], cfg)[0].detector).toBe('RULE');
    expect(mergeFindings([f(0, 'Priya', 'PERSON', 'RULE'), f(0, 'Priya', 'PERSON', 'NANO', 0.9)], cfg)[0].detector).toBe('NANO');
  });
  it('a secret category always wins the merged span', () => {
    const out = mergeFindings([f(0, 'my token abcd', 'OTHER_SENSITIVE', 'NANO', 0.9), f(9, 'abcd', 'API_KEY')], cfg);
    expect(out).toEqual([expect.objectContaining({ start: 0, end: 13, category: 'API_KEY' })]);
  });
  it('returns findings sorted and non-overlapping', () => {
    const out = mergeFindings([f(20, 'x@y.io', 'EMAIL'), f(0, 'Priya', 'PERSON', 'NANO', 0.9)], cfg);
    expect(out.map((x) => x.start)).toEqual([0, 20]);
  });
});

describe('policy', () => {
  it('uses the BRIEF §8.3 defaults', () => {
    expect(DEFAULT_POLICY.API_KEY).toBe('BLOCK');
    expect(DEFAULT_POLICY.HEALTH).toBe('GENERALIZE');
    expect(DEFAULT_POLICY.PERSON).toBe('PSEUDONYMIZE');
  });
  it('resolves org > user > remote config > built-in', () => {
    expect(resolveAction('PERSON', {})).toBe('PSEUDONYMIZE');
    expect(resolveAction('PERSON', { remoteConfig: { PERSON: 'KEEP' } })).toBe('KEEP');
    expect(resolveAction('PERSON', { remoteConfig: { PERSON: 'KEEP' }, userSettings: { PERSON: 'GENERALIZE' } })).toBe('GENERALIZE');
    expect(resolveAction('PERSON', { userSettings: { PERSON: 'GENERALIZE' }, orgPolicy: { PERSON: 'BLOCK' } })).toBe('BLOCK');
  });
});

describe('stand-ins', () => {
  it('pools meet the BRIEF sizes and contain no famous brands', () => {
    expect(POOLS.indianFirst.female.length + POOLS.indianFirst.male.length).toBeGreaterThanOrEqual(300);
    expect(POOLS.indianSurnames.length).toBeGreaterThanOrEqual(300);
    expect(POOLS.westernFirst.female.length + POOLS.westernFirst.male.length).toBeGreaterThanOrEqual(300);
    expect(POOLS.westernSurnames.length).toBeGreaterThanOrEqual(300);
    expect(POOLS.companies.bases.length).toBeGreaterThanOrEqual(300);
    const famous = new Set(POOLS.companies.famousBrandBlocklist);
    expect(POOLS.companies.bases.filter((b) => famous.has(b.toLowerCase()))).toEqual([]);
  });
  it('keeps an Indian name Indian, keeps name parts and creates aliases', () => {
    const m = createSessionMapping(7);
    const s = createStandInGenerator(7).generate('Priya Shah', 'PERSON', m);
    const [first, last] = s.split(' ');
    expect(s.split(' ')).toHaveLength(2);
    expect(POOLS.indianSurnames).toContain(last);
    expect(m.aliases.get(first)).toBe('Priya');
    expect(m.aliases.get(last)).toBe('Shah');
  });
  it('keeps an org suffix', () => {
    expect(createStandInGenerator(1).generate('Acme Pvt Ltd', 'ORG', createSessionMapping(1))).toMatch(/ Pvt Ltd$/);
  });
  it('makes .example emails, reusing a mapped person', () => {
    const m = createSessionMapping(3);
    const g = createStandInGenerator(3);
    const person = g.generate('Priya Shah', 'PERSON', m).toLowerCase().replace(' ', '.');
    expect(g.generate('priya.shah@acme.com', 'EMAIL', m)).toMatch(new RegExp(`^${person}@[a-z]+\\.example$`));
  });
  it('makes phones that keep the format and end in 0000x', () => {
    expect(createStandInGenerator(5).generate('+91 98200 12345', 'PHONE', createSessionMapping(5))).toMatch(/^\+91 9\d{4} 0000\d$/);
  });
  it('makes Luhn-failing cards with the same grouping', () => {
    const s = createStandInGenerator(9).generate('4111 1111 1111 1111', 'CARD', createSessionMapping(9));
    expect(s).toMatch(/^\d{4} \d{4} \d{4} \d{4}$/);
    expect(luhnCheck(s)).toBe(false);
  });
  it('falls back to a numbered stand-in when every draw collides', () => {
    const m = createSessionMapping(1);
    for (const c of POOLS.cities.global) m.originals.add(c);
    expect(createStandInGenerator(1).generate('Leeds', 'LOCATION', m)).toMatch(/^LOCATION_\d+$/);
  });
});

describe('generalize', () => {
  it('rounds amounts to a band', () => expect(generalize('FINANCIAL_AMOUNT', '₹4,52,000')).toBe('about ₹4.5 lakh'));
  it('maps health and legal terms to phrases', () => {
    expect(generalize('HEALTH', 'type 2 diabetes')).toBe('a chronic condition');
    expect(generalize('LEGAL_MATTER', 'divorce petition')).toBe('a family legal matter');
    expect(generalize('HEALTH', 'something rare')).toBe('a health condition');
  });
});

describe('restore', () => {
  const setup = () => {
    const m = createSessionMapping(42);
    const text = 'Priya Shah from Acme Corp';
    const r = scrubWithFindings(text, [f(0, 'Priya Shah', 'PERSON', 'NANO', 0.9), f(16, 'Acme Corp', 'ORG', 'NANO', 0.9)], m, buildPolicy({}));
    const [first, last] = r.actions[0].replacement!.split(' ');
    return { m, r, first, last, org: r.actions[1].replacement! };
  };
  it('round-trips the scrubbed text', () => {
    const { m, r } = setup();
    expect(restore(r.text, m).text).toBe('Priya Shah from Acme Corp');
  });
  it('handles possessives, aliases, titles and case variants', () => {
    const { m, first, last, org } = setup();
    const answer = `${first}'s plan: ask Ms. ${last} at ${org.toUpperCase()}. ${first.toLowerCase()} agrees.`;
    expect(restore(answer, m).text).toBe("Priya's plan: ask Ms. Shah at ACME CORP. priya agrees.");
  });
  it('reports restored spans', () => {
    const { m, first } = setup();
    const r = restore(`Hi ${first}`, m);
    expect(r.restoredSpans).toEqual([{ start: 3, end: 8, standIn: first, original: 'Priya' }]);
  });
  it('streams across chunk boundaries', () => {
    const { m, r } = setup();
    const buf = createStreamingRestoreBuffer(m, 0);
    let out = '';
    for (const ch of r.text) out += buf.push(ch);
    out += buf.flush();
    expect(out).toBe('Priya Shah from Acme Corp');
  });
});

describe('scrub', () => {
  it('blocks secrets with numbered placeholders and reuses them', () => {
    const m = createSessionMapping(1);
    const text = 'key sk-ant-abcdefghijklmnopqrst and again sk-ant-abcdefghijklmnopqrst';
    const r = scrubWithFindings(text, detectRules(text), m, buildPolicy({}));
    expect(r.text).toBe('key ‹secret-1› and again ‹secret-1›');
  });
  it('runs async detectors and counts failures as reduced protection', async () => {
    const broken = { detect: async () => { throw new Error('timeout'); } };
    const r = await scrub('mail a.b@acme.com', [rulesDetector, broken], createSessionMapping(1), buildPolicy({}));
    expect(r.failedDetectors).toBe(1);
    expect(r.text).toMatch(/@[a-z]+\.example$/);
  });
  it('returns empty input unchanged', () => {
    expect(scrubWithFindings('', [], createSessionMapping(1), buildPolicy({})).text).toBe('');
  });
});
