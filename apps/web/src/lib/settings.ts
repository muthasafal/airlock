import type { Category, Action } from '@airlock/scrub-engine';

/**
 * User settings stored in localStorage with defaults.
 * BRIEF §P1-3: Session TTL, category overrides, stand-in visibility, language.
 * Settings hold preferences only, never content.
 */
export interface Settings {
  sessionTtlHours: number;
  categoryOverrides: Partial<Record<Category, Action>>;
  showStandIns: boolean;
  language: string;
}

const KEY = 'airlock-settings';
export const DEFAULT_SETTINGS: Settings = {
  sessionTtlHours: 24,
  categoryOverrides: {},
  showStandIns: true,
  language: 'en',
};

/** Reads settings from localStorage with defaults. */
export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

const listeners = new Set<() => void>();

/** Updates settings in localStorage. */
export function updateSettings(patch: Partial<Settings>): void {
  localStorage.setItem(KEY, JSON.stringify({ ...getSettings(), ...patch }));
  listeners.forEach((l) => l());
}

export function onSettingsChanged(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
