import { openDB, type IDBPDatabase } from 'idb';
import type { Category } from '@airlock/scrub-engine';
import type { ScrubbedText } from './cloud-client';
import type { RouteDecision } from './router';

/**
 * Receipt: proof of what left the device.
 * Stored locally in IndexedDB. Never uploaded. BRIEF §P0-7.
 * A receipt keeps the OUTBOUND text only. The "originals" side of the diff is rebuilt on
 * demand by restoring the outbound text with the session mapping from the encrypted vault,
 * so receipts never hold raw sensitive values themselves.
 */

export type ProtectionLevel = 'Full' | 'Reduced';
export type InferenceSourceLabel = 'ON_DEVICE' | 'IN_CLOUD';

export interface Receipt {
  id: string;
  timestamp: number;
  sessionId: string;
  routeDecision: RouteDecision;
  routeReason: string;
  /** Per step: detection, classification, answer. */
  inferenceSource: Record<string, InferenceSourceLabel>;
  /** The exact text that left the device (stand-ins only), or null when nothing left. */
  outboundPayload: ScrubbedText | null;
  categoryCounts: Partial<Record<Category, number>>;
  detectorsUsed: string[]; // e.g., ['RULE', 'NANO']
  protectionLevel: ProtectionLevel;
  /** How many secrets were withheld as ‹secret-N›. */
  withheldSecrets: number;
  /** Cloud model used, for CLOUD_SCRUBBED. */
  model?: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;
function receiptsDb(): Promise<IDBPDatabase> {
  dbPromise ??= openDB('airlock-receipts', 1, {
    upgrade(d) {
      d.createObjectStore('receipts', { keyPath: 'id' });
    },
  });
  return dbPromise;
}

/** Saves a receipt to IndexedDB. Never uploads. BRIEF §P0-7. */
export async function saveReceipt(r: Receipt): Promise<void> {
  await (await receiptsDb()).put('receipts', r);
  notify();
}

/** All receipts, newest first. */
export async function listReceipts(): Promise<Receipt[]> {
  const all = (await (await receiptsDb()).getAll('receipts')) as Receipt[];
  return all.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteReceipt(id: string): Promise<void> {
  await (await receiptsDb()).delete('receipts', id);
  notify();
}

export async function clearReceipts(): Promise<void> {
  await (await receiptsDb()).clear('receipts');
  notify();
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
/** Subscribe to receipt changes (used by the receipts hook). */
export function onReceiptsChanged(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
