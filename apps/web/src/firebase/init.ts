import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';

/**
 * Initializes Firebase from environment variables.
 * VITE_FIREBASE_* env vars are read from .env.local (the web config is public by design;
 * App Check protects it). Called once at startup. When the config is missing, `app` is null
 * and Airlock runs in rules-only mode with cloud features switched off.
 */
const env = import.meta.env;

export const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** True when a real web config is present (not the .env.example placeholders). */
export const isFirebaseConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY &&
    env.VITE_FIREBASE_PROJECT_ID &&
    env.VITE_FIREBASE_APP_ID &&
    !String(env.VITE_FIREBASE_API_KEY).startsWith('your-'),
);

export const app: FirebaseApp | null = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
