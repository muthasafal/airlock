import { UserCredential } from 'firebase/auth';

/**
 * Signs in with Google provider.
 * Opens a popup or redirect flow. BRIEF §P0-10.
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  throw new Error('not implemented: architecture-skeleton');
}

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<void> {
  throw new Error('not implemented: architecture-skeleton');
}
