import type { Category } from './types.js';

/**
 * GENERALIZE replacements (BRIEF §8.2): not reversible, but deterministic, so the same
 * original always becomes the same phrase.
 */

const HEALTH: Array<[RegExp, string]> = [
  [/diabet|thyroid|hypertension|blood pressure|asthma|arthritis|hiv|kidney|copd|epilep/i, 'a chronic condition'],
  [/cancer|tumou?r|leukemia|lymphoma|chemo/i, 'a serious illness'],
  [/depress|anxiety|bipolar|adhd|ptsd|schizo|mental|panic|ocd/i, 'a mental health condition'],
  [/pregnan|maternity|ivf|miscarr/i, 'a personal health matter'],
  [/surgery|operation|fracture|injur|accident/i, 'a medical procedure'],
  [/covid|flu|fever|infection|tubercul|malaria|dengue/i, 'an illness'],
];

const LEGAL: Array<[RegExp, string]> = [
  [/divorce|custody|alimony|matrimon/i, 'a family legal matter'],
  [/bankrupt|insolven|debt recovery|default/i, 'a financial legal matter'],
  [/arrest|criminal|fir\b|bail|police|charge/i, 'a criminal legal matter'],
  [/harass|discriminat|termination|wrongful|labou?r/i, 'an employment legal matter'],
  [/patent|trademark|copyright|infring/i, 'an intellectual property matter'],
  [/lawsuit|litigation|suit|case|dispute|arbitration|petition|notice/i, 'a legal matter'],
];

const UNITS: Record<string, number> = {
  k: 1e3, thousand: 1e3, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, l: 1e5,
  cr: 1e7, crore: 1e7, crores: 1e7, m: 1e6, mn: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9,
};

/** Parses "₹4,52,000", "Rs 4.5 lakh", "$12k", "USD 3.2 million" into currency + value. */
export function parseAmount(text: string): { currency: string; value: number } | null {
  const m = text.match(
    /(₹|rs\.?|inr|\$|usd|€|eur|£|gbp)?\s*([\d][\d,]*(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?|l|cr|crores?|mn|m|million|bn|b|billion)?\b\s*(₹|rs\.?|inr|\$|usd|€|eur|£|gbp)?/i,
  );
  if (!m) return null;
  const raw = Number(m[2].replace(/,/g, ''));
  if (!Number.isFinite(raw)) return null;
  const unit = m[3] ? UNITS[m[3].toLowerCase()] ?? 1 : 1;
  const cur = (m[1] ?? m[4] ?? '').toLowerCase();
  const currency = cur === '$' || cur === 'usd' ? '$' : cur === '€' || cur === 'eur' ? '€' : cur === '£' || cur === 'gbp' ? '£' : cur ? '₹' : '';
  return { currency, value: raw * unit };
}

/** Formats a value the Indian way for ₹ (lakh / crore) and with k / million otherwise. */
export function formatAmount(currency: string, value: number): string {
  const round2 = (n: number) => {
    const digits = Math.max(0, 1 - Math.floor(Math.log10(Math.abs(n) || 1)));
    return Number(n.toFixed(Math.min(2, digits)));
  };
  if (currency === '₹') {
    if (value >= 1e7) return `₹${round2(value / 1e7)} crore`;
    if (value >= 1e5) return `₹${round2(value / 1e5)} lakh`;
    if (value >= 1e3) return `₹${round2(value / 1e3)} thousand`;
    return `₹${Math.round(value)}`;
  }
  const c = currency;
  if (value >= 1e9) return `${c}${round2(value / 1e9)} billion`;
  if (value >= 1e6) return `${c}${round2(value / 1e6)} million`;
  if (value >= 1e3) return `${c}${round2(value / 1e3)}k`;
  return `${c}${Math.round(value)}`;
}

/** Rounds to two significant figures, keeping the order of magnitude. */
export function roundToBand(value: number): number {
  if (value <= 0) return value;
  const mag = Math.pow(10, Math.floor(Math.log10(value)) - 1);
  return Math.round(value / mag) * mag;
}

/** "about ₹4.5 lakh" for "₹4,52,000". Falls back to "an amount of money". */
export function generalizeAmount(text: string): string {
  const parsed = parseAmount(text);
  if (!parsed || parsed.value === 0) return 'an amount of money';
  return `about ${formatAmount(parsed.currency, roundToBand(parsed.value))}`;
}

/** "a date in the 1990s" for a date of birth with a 4-digit year; otherwise "a date of birth". */
export function generalizeDate(text: string): string {
  const y = text.match(/\b(19|20)\d{2}\b/);
  if (!y) return 'a date of birth';
  const decade = Math.floor(Number(y[0]) / 10) * 10;
  return `a date in the ${decade}s`;
}

/** Deterministic GENERALIZE phrase for a finding. BRIEF §8.2. */
export function generalize(category: Category, text: string): string {
  switch (category) {
    case 'FINANCIAL_AMOUNT':
      return generalizeAmount(text);
    case 'HEALTH':
      return HEALTH.find(([re]) => re.test(text))?.[1] ?? 'a health condition';
    case 'LEGAL_MATTER':
      return LEGAL.find(([re]) => re.test(text))?.[1] ?? 'a legal matter';
    case 'DATE_OF_BIRTH':
      return generalizeDate(text);
    case 'PERSON':
      return 'a person';
    case 'ORG':
    case 'ORG_TERM':
      return 'an organisation';
    case 'LOCATION':
      return 'a place';
    case 'INTERNAL_PROJECT':
      return 'an internal project';
    case 'EMAIL':
      return 'an email address';
    case 'PHONE':
      return 'a phone number';
    default:
      return `a ${category.toLowerCase().replace(/_/g, ' ')}`;
  }
}
