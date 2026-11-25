import { useCallback, useEffect, useState } from 'react';
import { asScrubbed } from '../../lib/cloud-client';
import { saveReceipt } from '../../lib/receipts';
import { copyText, initSession, restoreForSession, scrubForSession, sessionStore } from '../../lib/session';

export interface ClipboardAirlockHook {
  cleaned: string;
  status: string;
  busy: boolean;
  cleanAndCopy: (text: string) => Promise<void>;
  restore: (answer: string) => { text: string; restoredSpans: Array<{ start: number; end: number; standIn: string; original: string }> };
}

/**
 * Clipboard airlock (BRIEF §P0-8): cleans text with the same session mapping as the chat,
 * copies it to the clipboard for any AI tool, and restores a pasted answer locally.
 */
export function useClipboardAirlock(): ClipboardAirlockHook {
  const [cleaned, setCleaned] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void initSession();
  }, []);
  const cleanAndCopy = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const s = await scrubForSession(text);
      setCleaned(s.text);
      await copyText(s.text);
      const n = s.findings.length;
      setStatus(
        `Copied. We swapped ${n} sensitive detail${n === 1 ? '' : 's'}${s.blocked ? ` and held back ${s.blocked} secret${s.blocked === 1 ? '' : 's'}` : ''}. ` +
          (s.protection === 'Full' ? 'Checked on your device with the private model.' : 'Rule checks only, so protection is reduced.'),
      );
      await saveReceipt({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        sessionId: sessionStore.getSnapshot().sessionId,
        routeDecision: 'CLOUD_SCRUBBED',
        routeReason: 'Clipboard airlock: the cleaned text was copied for you to paste into another AI tool.',
        inferenceSource: { detection: 'ON_DEVICE' },
        outboundPayload: asScrubbed(s.text),
        categoryCounts: s.counts,
        detectorsUsed: s.detectorsUsed,
        protectionLevel: s.protection,
        withheldSecrets: s.blocked,
      }).catch(() => undefined);
    } catch {
      setStatus("We couldn't copy to the clipboard. You can still select the cleaned text and copy it.");
    } finally {
      setBusy(false);
    }
  }, []);
  const restore = useCallback((answer: string) => restoreForSession(answer), []);
  return { cleaned, status, busy, cleanAndCopy, restore };
}
