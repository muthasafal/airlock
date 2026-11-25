import { Category } from '@airlock/scrub-engine';
import { ScrubbedText } from './cloud-client';
import { RouteDecision } from './router';

/**
 * Receipt: proof of what left the device.
 * Stored locally in IndexedDB. Never uploaded. BRIEF §P0-7.
 */

export type ProtectionLevel = 'Full' | 'Reduced';

export interface Receipt {
  id: string;
  timestamp: number;
  routeDecision: RouteDecision;
  routeReason: string;
  inferenceSource: Record<string, 'ON_DEVICE' | 'IN_CLOUD'>;
  outboundPayload: ScrubbedText; // scrubbed text only, never original
  categoryCounts: Partial<Record<Category, number>>;
  detectorsUsed: string[]; // e.g., ['RULE', 'NANO']
  protectionLevel: ProtectionLevel;
}

/** Saves a receipt to IndexedDB. Never uploads. BRIEF §P0-7. */
export async function saveReceipt(_r: Receipt): Promise<void> {
  throw new Error('not implemented: architecture-skeleton');
}

export async function listReceipts(): Promise<Receipt[]> {
  throw new Error('not implemented: architecture-skeleton');
}

export async function clearReceipts(): Promise<void> {
  throw new Error('not implemented: architecture-skeleton');
}
