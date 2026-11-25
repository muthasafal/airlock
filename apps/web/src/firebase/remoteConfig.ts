import { fetchAndActivate, getRemoteConfig, getValue } from 'firebase/remote-config';
import { app } from './init';

/**
 * Remote Config parameters with defaults.
 * All 9 keys from BRIEF §9.3 in one place.
 * Typed accessors for each key. Model names live only here.
 */

export interface RemoteConfigValues {
  cloud_model: string;
  cloud_model_hard: string;
  nano_min_confidence: number;
  local_answer_max_chars: number;
  chunk_chars: number;
  block_request_on_secret: boolean;
  session_ttl_hours: number;
  feature_screenshot: boolean;
  feature_org_mode: boolean;
}

export const REMOTE_CONFIG_DEFAULTS: RemoteConfigValues = {
  cloud_model: 'gemini-3.5-flash-lite',
  cloud_model_hard: 'gemini-3.8-flash',
  nano_min_confidence: 0.5,
  local_answer_max_chars: 3000,
  chunk_chars: 4000,
  block_request_on_secret: true,
  session_ttl_hours: 24,
  feature_screenshot: false,
  feature_org_mode: true,
};

let values: RemoteConfigValues = { ...REMOTE_CONFIG_DEFAULTS };
let started: Promise<RemoteConfigValues> | null = null;

/** Fetches and activates Remote Config once (1 hour minimum interval). Falls back to defaults. */
export function initRemoteConfig(): Promise<RemoteConfigValues> {
  if (started) return started;
  started = (async () => {
    if (!app) return values;
    try {
      const rc = getRemoteConfig(app);
      rc.settings.minimumFetchIntervalMillis = 60 * 60 * 1000;
      rc.defaultConfig = { ...REMOTE_CONFIG_DEFAULTS };
      await fetchAndActivate(rc);
      const read = <K extends keyof RemoteConfigValues>(key: K): RemoteConfigValues[K] => {
        const v = getValue(rc, key);
        const d = REMOTE_CONFIG_DEFAULTS[key];
        if (typeof d === 'number') return (Number.isFinite(v.asNumber()) ? v.asNumber() : d) as RemoteConfigValues[K];
        if (typeof d === 'boolean') return v.asBoolean() as RemoteConfigValues[K];
        return (v.asString() || d) as RemoteConfigValues[K];
      };
      values = Object.fromEntries(
        (Object.keys(REMOTE_CONFIG_DEFAULTS) as Array<keyof RemoteConfigValues>).map((k) => [k, read(k)]),
      ) as unknown as RemoteConfigValues;
    } catch {
      // Offline or not set up: keep defaults.
    }
    return values;
  })();
  return started;
}

export const getRemoteConfigValues = (): RemoteConfigValues => values;
export const getCloudModel = (): string => values.cloud_model;
export const getCloudModelHard = (): string => values.cloud_model_hard;
export const getNanoMinConfidence = (): number => values.nano_min_confidence;
export const getLocalAnswerMaxChars = (): number => values.local_answer_max_chars;
export const getChunkChars = (): number => values.chunk_chars;
export const getBlockRequestOnSecret = (): boolean => values.block_request_on_secret;
export const getSessionTtlHours = (): number => values.session_ttl_hours;
export const getFeatureScreenshot = (): boolean => values.feature_screenshot;
export const getFeatureOrgMode = (): boolean => values.feature_org_mode;
