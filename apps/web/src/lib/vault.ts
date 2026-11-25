import { VaultInterface } from '@airlock/scrub-engine';

/**
 * Creates a vault backed by IndexedDB. Encrypts with AES-GCM, non-extractable key.
 * Key is stored in a separate IDB object store.
 * BRIEF §P0-4.
 */
export function createVault(): VaultInterface {
  throw new Error('not implemented: architecture-skeleton');
}
