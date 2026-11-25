import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { NanoAvailability } from '@airlock/nano-detector';
import { enableOnDeviceModel, initSession, sessionStore } from '../../lib/session';

export interface ProtectionStatusHook {
  availability: NanoAvailability;
  initProgress: number | null;
  startInit: () => void;
  /** 'full' | 'reduced' | 'unavailable', the shape ProtectionStatus renders. */
  level: 'full' | 'reduced' | 'unavailable';
  firebaseConfigured: boolean;
  consent: boolean;
}

/**
 * Hook for Nano availability and initialization status.
 * Returns availability, progress % (0-100), and startInit callback (call it from a click:
 * the download needs a user gesture). BRIEF §P0-9.
 */
export function useProtectionStatus(): ProtectionStatusHook {
  const s = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot);
  useEffect(() => {
    void initSession();
  }, []);
  const startInit = useCallback(() => void enableOnDeviceModel(), []);
  const level = s.availability === 'available' ? 'full' : s.availability === 'unavailable' ? 'unavailable' : 'reduced';
  return {
    availability: s.availability,
    initProgress: s.initProgress,
    startInit,
    level,
    firebaseConfigured: s.firebaseConfigured,
    consent: s.consent,
  };
}
