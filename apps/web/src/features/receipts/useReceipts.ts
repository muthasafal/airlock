import { useCallback, useEffect, useState } from 'react';
import { clearReceipts, deleteReceipt, listReceipts, onReceiptsChanged, type Receipt } from '../../lib/receipts';
import { restoreForSession, sessionStore } from '../../lib/session';

export interface UseReceiptsHook {
  receipts: Receipt[];
  clear: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  exportJson: () => void;
  /** The original side of the diff, rebuilt locally from the vault mapping (null if forgotten). */
  originalFor: (r: Receipt) => string | null;
}

/**
 * Hook for receipts list, clear, and export.
 * Logic only; UI reads from this. BRIEF §P0-7.
 */
export function useReceipts(): UseReceiptsHook {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () => void listReceipts().then((r) => alive && setReceipts(r)).catch(() => undefined);
    load();
    const off = onReceiptsChanged(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(receipts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airlock-receipts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [receipts]);
  const originalFor = useCallback((r: Receipt) => {
    if (!r.outboundPayload) return null;
    if (r.sessionId !== sessionStore.getSnapshot().sessionId) return null;
    return restoreForSession(r.outboundPayload).text;
  }, []);
  return { receipts, clear: clearReceipts, remove: deleteReceipt, exportJson, originalFor };
}
