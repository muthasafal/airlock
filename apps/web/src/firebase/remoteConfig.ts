/**
 * Remote Config parameters with defaults.
 * All 9 keys from BRIEF §9.3 in one place.
 * Typed accessors for each key.
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

export function getCloudModel(): string {
  throw new Error('not implemented: architecture-skeleton');
}
export function getCloudModelHard(): string {
  throw new Error('not implemented: architecture-skeleton');
}
export function getNanoMinConfidence(): number {
  throw new Error('not implemented: architecture-skeleton');
}
export function getLocalAnswerMaxChars(): number {
  throw new Error('not implemented: architecture-skeleton');
}
export function getChunkChars(): number {
  throw new Error('not implemented: architecture-skeleton');
}
export function getBlockRequestOnSecret(): boolean {
  throw new Error('not implemented: architecture-skeleton');
}
export function getSessionTtlHours(): number {
  throw new Error('not implemented: architecture-skeleton');
}
export function getFeatureScreenshot(): boolean {
  throw new Error('not implemented: architecture-skeleton');
}
export function getFeatureOrgMode(): boolean {
  throw new Error('not implemented: architecture-skeleton');
}
