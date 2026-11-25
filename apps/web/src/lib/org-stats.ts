import { increment, setDoc } from 'firebase/firestore';
import type { Category } from '@airlock/scrub-engine';
import type { RouteDecision } from './router';
import { getStatsRef } from '../firebase/firestore';

/**
 * Org stats client: increments only. Never writes strings.
 * Uses FieldValue.increment() only. BRIEF §9.2 security rules.
 * Writes { counts: {CATEGORY: +n}, requests: +1, routes: {ROUTE: +1} } for today's doc.
 */
export async function incrementStats(
  orgId: string,
  date: string,
  counts: Partial<Record<Category, number>>,
  route: RouteDecision,
): Promise<void> {
  const countIncrements = Object.fromEntries(
    Object.entries(counts)
      .filter(([, n]) => typeof n === 'number' && n > 0)
      .map(([k, n]) => [k, increment(Math.floor(n as number))]),
  );
  await setDoc(
    getStatsRef(orgId, date),
    { counts: countIncrements, requests: increment(1), routes: { [route]: increment(1) } } as never,
    { merge: true },
  );
}

/** Today's stats document id (yyyy-mm-dd, local time). */
export function todayId(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
