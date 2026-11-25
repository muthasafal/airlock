import { Receipt } from '../../lib/receipts';

export interface UseReceiptsHook {
  receipts: Receipt[];
  clear: () => Promise<void>;
  exportJson: () => void;
}

/**
 * Hook for receipts list, clear, and export.
 * Logic only; UI reads from this. BRIEF §P0-7.
 */
export function useReceipts(): UseReceiptsHook {
  throw new Error('not implemented: architecture-skeleton');
}
