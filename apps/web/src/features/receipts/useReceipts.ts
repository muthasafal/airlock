import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { clearReceipts, deleteReceipt, listReceipts, onReceiptsChanged, type Receipt } from '../../lib/receipts';
import { initSession, restoreForSession, sessionStore } from '../../lib/session';

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
  // The vault mapping is needed to rebuild the originals side of the diff.
  const session = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot);
  useEffect(() => {
    void initSession();
  }, []);
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
  const originalFor = useCallback(
    (r: Receipt) => {
      if (!r.outboundPayload || !session.ready) return null;
      if (r.sessionId !== session.sessionId) return null;
      return restoreForSession(r.outboundPayload).text;
    },
    [session.ready, session.sessionId],
  );
  return { receipts, clear: clearReceipts, remove: deleteReceipt, exportJson, originalFor };
}
