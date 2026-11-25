import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { Finding } from '@airlock/scrub-engine';
import type { NanoAvailability } from '@airlock/nano-detector';
import type { ProtectionLevel } from '../../lib/receipts';
import type { RouteOverride } from '../../lib/router';
import type { ChamberState } from '../../ui/AirlockChamber';
import {
  forgetSession,
  initSession,
  previewFindings,
  sendWithoutSecret,
  sessionStore,
  setConsent,
  submitMessage,
  type ChatTurn,
} from '../../lib/session';

export type Turn = ChatTurn;

export interface AirlockSession {
  turns: Turn[];
  submit: (text: string, override?: RouteOverride) => Promise<void>;
  previewFindings: (text: string) => Finding[];
  chamberState: ChamberState;
  protectionLevel: ProtectionLevel;
  sessionId: string;
  forgetSession: () => void;
  busy: boolean;
  consent: boolean;
  setConsent: (v: boolean) => void;
  availability: NanoAvailability;
  firebaseConfigured: boolean;
  sendWithoutSecret: (turnId: string) => Promise<void>;
}

/**
 * Hook managing a full Airlock chat session.
 * Scrubbing, cloud calls, restore, receipts, vault: all orchestrated in lib/session.
 * All logic lives there; UI components are presentational only. BRIEF §P0-6.
 */
export function useAirlockSession(): AirlockSession {
  const s = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot);
  useEffect(() => {
    void initSession();
  }, []);
  const forget = useCallback(() => void forgetSession(), []);
  return {
    turns: s.turns,
    submit: submitMessage,
    previewFindings,
    chamberState: s.chamberState,
    protectionLevel: s.protectionLevel,
    sessionId: s.sessionId,
    forgetSession: forget,
    busy: s.busy,
    consent: s.consent,
    setConsent,
    availability: s.availability,
    firebaseConfigured: s.firebaseConfigured,
    sendWithoutSecret,
  };
}
