import { Finding } from '@airlock/scrub-engine';
import { Receipt } from '../../lib/receipts';

interface RestoredSpanInfo {
  start: number;
  end: number;
  standIn: string;
  original: string;
}

interface TurnProps {
  original: string;
  originalFindings: Finding[];
  scrubbed: string;
  answer: string;
  restoredSpans: RestoredSpanInfo[];
  receipt: Receipt;
}

/**
 * A single chat turn, showing three things:
 * 1. What you wrote with sensitive spans highlighted
 * 2. What was sent (stand-in version)
 * 3. The answer, restored
 * BRIEF §P0-6.
 */
export default function Turn(_props: TurnProps): React.JSX.Element {
  throw new Error('not implemented: architecture-skeleton');
}
