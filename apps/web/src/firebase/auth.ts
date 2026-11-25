import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { app } from './init';

/**
 * Signs in with Google provider (popup). Optional for individuals, required for org mode.
 * BRIEF §P0-10.
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  if (!app) throw new Error('Firebase is not configured');
  return signInWithPopup(getAuth(app), new GoogleAuthProvider());
}

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<void> {
  if (!app) return;
  await fbSignOut(getAuth(app));
}

/** Subscribes to the signed-in user (null when signed out or not configured). */
export function onUserChanged(cb: (user: User | null) => void): () => void {
  if (!app) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(getAuth(app), cb);
}
