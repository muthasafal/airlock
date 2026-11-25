import { Category } from '@airlock/scrub-engine';
import { RouteDecision } from './router';

/**
 * Org stats client: increments only. Never writes strings.
 * Uses FieldValue.increment() only. BRIEF §9.2 security rules.
 */

export async function incrementStats(
  _orgId: string,
  _date: string,
  _counts: Partial<Record<Category, number>>,
  _route: RouteDecision,
): Promise<void> {
  throw new Error('not implemented: architecture-skeleton');
}
