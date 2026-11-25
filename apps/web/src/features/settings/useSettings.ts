import { useCallback, useSyncExternalStore } from 'react';
import { getSettings, onSettingsChanged, updateSettings, type Settings } from '../../lib/settings';
import { clearReceipts, listReceipts } from '../../lib/receipts';
import { forgetAllSessions } from '../../lib/session';

let cached = getSettings();
const subscribe = (cb: () => void) =>
  onSettingsChanged(() => {
    cached = getSettings();
    cb();
  });

/** Settings (BRIEF §P1-3) plus export and delete of local data. */
export function useSettings() {
  const settings = useSyncExternalStore(subscribe, () => cached);
  const update = useCallback((patch: Partial<Settings>) => updateSettings(patch), []);
  const exportLocalData = useCallback(async () => {
    const data = { settings: getSettings(), receipts: await listReceipts() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'airlock-local-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);
  const deleteLocalData = useCallback(async () => {
    await forgetAllSessions();
    await clearReceipts();
    localStorage.removeItem('airlock-settings');
    updateSettings({});
  }, []);
  return { settings, update, exportLocalData, deleteLocalData };
}
