import type { Category, DetectorConfig, Finding } from './types.js';

/** Severity order. Higher index = higher severity. Used by merge for overlap resolution. BRIEF §8.1 Layer C. */
export const CATEGORY_SEVERITY: Category[] = [
  'OTHER_SENSITIVE',
  'DATE_OF_BIRTH',
  'LOCATION',
  'ORG_TERM',
  'INTERNAL_PROJECT',
  'ORG',
  'PERSON',
  'EMAIL',
  'PHONE',
  'UPI',
  'IP_ADDRESS',
  'LEGAL_MATTER',
  'FINANCIAL_AMOUNT',
  'IFSC',
  'BANK_ACCOUNT',
  'HEALTH',
  'PAN',
  'CARD',
  'AADHAAR',
  'GOVERNMENT_ID',
  'URL_SECRET',
  'JWT',
  'API_KEY',
  'PASSWORD',
  'PRIVATE_KEY',
  'CREDENTIAL',
];

/** Secret categories: whenever one overlaps anything, the merged span takes the secret's category. */
const SECRETS: ReadonlySet<Category> = new Set<Category>(['URL_SECRET', 'JWT', 'API_KEY', 'PASSWORD', 'PRIVATE_KEY', 'CREDENTIAL']);

const severity = (c: Category) => CATEGORY_SEVERITY.indexOf(c);

/**
 * True when `a` should be the primary finding over the overlapping `b` (BRIEF §8.1 Layer C):
 * the longer span; at equal length rules win for structured types and Nano wins for PERSON / ORG;
 * then the higher-severity category; then confidence and position (for determinism).
 */
export function beats(a: Finding, b: Finding): boolean {
  const la = a.end - a.start;
  const lb = b.end - b.start;
  if (la !== lb) return la > lb;
  if (a.detector !== b.detector) {
    const nanoWins = (a.category === 'PERSON' || a.category === 'ORG') && (b.category === 'PERSON' || b.category === 'ORG');
    return nanoWins ? a.detector === 'NANO' : a.detector === 'RULE';
  }
  const sa = severity(a.category);
  const sb = severity(b.category);
  if (sa !== sb) return sa > sb;
  if (a.confidence !== b.confidence) return a.confidence > b.confidence;
  return a.start <= b.start;
}

/**
 * Merges findings from all detectors: drops Nano findings below `nanoMinConfidence`, sorts by
 * start, and resolves each cluster of overlapping findings into ONE finding covering the union
 * of the cluster, so no part of an overlapped value can leak. The cluster takes the category of
 * its primary finding (see `beats`), except that a secret category (key, token, password,
 * private key, credential) always wins. BRIEF §8.1 Layer C.
 */
export function mergeFindings(findings: Finding[], config: DetectorConfig): Finding[] {
  const candidates = findings
    .filter((f) => f.end > f.start)
    .filter((f) => f.detector !== 'NANO' || f.confidence >= config.nanoMinConfidence)
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const clusters: Finding[][] = [];
  let end = -1;
  for (const f of candidates) {
    if (clusters.length > 0 && f.start < end) {
      clusters[clusters.length - 1].push(f);
      end = Math.max(end, f.end);
    } else {
      clusters.push([f]);
      end = f.end;
    }
  }

  return clusters.map((cluster) => {
    if (cluster.length === 1) return cluster[0];
    const primary = cluster.reduce((best, f) => (beats(f, best) ? f : best));
    const start = Math.min(...cluster.map((f) => f.start));
    const stop = Math.max(...cluster.map((f) => f.end));
    const secret = cluster
      .filter((f) => SECRETS.has(f.category))
      .reduce<Finding | null>((best, f) => (!best || severity(f.category) > severity(best.category) ? f : best), null);
    const category = secret ? secret.category : primary.category;
    if (start === primary.start && stop === primary.end) return { ...primary, category };
    // The union is wider than the primary span: rebuild its text from the members.
    const pieces: string[] = [];
    let at = start;
    for (const f of [...cluster].sort((a, b) => a.start - b.start)) {
      if (f.end <= at) continue;
      pieces.push(f.text.slice(Math.max(0, at - f.start)));
      at = f.end;
    }
    return {
      start,
      end: stop,
      text: pieces.join(''),
      category,
      detector: primary.detector,
      confidence: Math.max(...cluster.map((f) => f.confidence)),
    };
  });
}
