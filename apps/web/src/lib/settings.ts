import type { Category, Action } from '@airlock/scrub-engine';

/**
 * User settings stored in localStorage with defaults.
 * BRIEF §P1-3: Session TTL, category overrides, stand-in visibility, language.
 * Settings hold preferences only, never content.
 */
export type CloudModelChoice = 'auto' | 'gemini-3.5-flash-lite' | 'gemini-3.8-flash';

/** Cloud models the user can pick. Names match the Remote Config defaults (BRIEF §6). */
export const CLOUD_MODEL_OPTIONS: Array<{ value: CloudModelChoice; label: string }> = [
  { value: 'auto', label: 'Let Airlock choose (light model, stronger one for hard questions)' },
  { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (fastest)' },
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (stronger reasoning)' },
];

/** How long to wait for on-device detection per chunk. */
export const NANO_WAIT_OPTIONS = [8, 20, 45];

export interface Settings {
  sessionTtlHours: number;
  categoryOverrides: Partial<Record<Category, Action>>;
  showStandIns: boolean;
  /** Which cloud model answers: 'auto' follows Remote Config (light model, stronger one for hard reasoning or code). */
  cloudModel: CloudModelChoice;
  /** How long the private on-device model may take to check a message before Airlock falls back to rule checks. */
  nanoWaitSeconds: number;
  language: string;
}

const KEY = 'airlock-settings';
export const DEFAULT_SETTINGS: Settings = {
  sessionTtlHours: 24,
  categoryOverrides: {},
  showStandIns: true,
  cloudModel: 'auto',
  nanoWaitSeconds: 20,
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
