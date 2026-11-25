import { FirebaseApp } from 'firebase/app';

/**
 * Initializes App Check.
 * Dev: sets debug token flag before initialization.
 * Prod: ReCaptchaV3Provider with siteKey from env.
 * Must be called before any AI Logic call. BRIEF §9.4.
 */
export function initAppCheck(_app: FirebaseApp): void {
  throw new Error('not implemented: architecture-skeleton');
}
