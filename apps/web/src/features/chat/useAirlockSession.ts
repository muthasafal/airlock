import { Finding } from '@airlock/scrub-engine';
import { Receipt, ProtectionLevel } from '../../lib/receipts';
import { RouteDecision } from '../../lib/router';
import { ChamberState } from '../../ui/AirlockChamber';

export interface Turn {
  id: string;
  original: string;
  originalFindings: Finding[];
  scrubbed: string;
  answer: string;
  restoredSpans: Array<{ start: number; end: number; standIn: string; original: string }>;
  receipt: Receipt;
}

export interface AirlockSession {
  turns: Turn[];
  submit: (text: string, override?: RouteDecision) => Promise<void>;
  previewFindings: (text: string) => Finding[];
  chamberState: ChamberState;
  protectionLevel: ProtectionLevel;
  sessionId: string;
  forgetSession: () => void;
}

/**
 * Hook managing a full Airlock chat session.
 * Scrubbing, cloud calls, restore, receipts, vault — all orchestrated here.
 * All logic lives here; UI components are presentational only. BRIEF §P0-6.
 */
export function useAirlockSession(): AirlockSession {
  throw new Error('not implemented: architecture-skeleton');
}
