import { Category, Action } from '@airlock/scrub-engine';

/**
 * User settings stored in localStorage with defaults.
 * BRIEF §P1-3: Session TTL, category overrides, stand-in visibility, language.
 */

export interface Settings {
  sessionTtlHours: number;
  categoryOverrides: Partial<Record<Category, Action>>;
  showStandIns: boolean;
  language: string;
}

/** Reads settings from localStorage with defaults. */
export function getSettings(): Settings {
  throw new Error('not implemented: architecture-skeleton');
}

/** Updates settings in localStorage. */
export function updateSettings(_patch: Partial<Settings>): void {
  throw new Error('not implemented: architecture-skeleton');
}
