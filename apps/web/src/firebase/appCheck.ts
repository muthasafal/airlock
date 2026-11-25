import type { FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';

let instance: AppCheck | null = null;

/**
 * Initializes App Check.
 * Dev: sets the debug token flag before initialization (register the printed token in the
 * console; never commit it). Prod: ReCaptchaV3Provider with the site key from env.
 * Must be called before any AI Logic call. BRIEF §9.4. Idempotent.
 */
export function initAppCheck(app: FirebaseApp): AppCheck {
  if (instance) return instance;
  if (import.meta.env.DEV) {
    // A fixed debug token can be supplied through VITE_APPCHECK_DEBUG_TOKEN (in .env.local, gitignored).
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
  }
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'debug-mode-no-site-key';
  instance = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return instance;
}
