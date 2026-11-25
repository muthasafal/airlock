import { Finding } from '@airlock/scrub-engine';

export type ChamberState = 'idle' | 'scrubbing' | 'sending' | 'local' | 'blocked' | 'restoring';

interface AirlockChamberProps {
  state: ChamberState;
  findings?: Finding[];
}

/**
 * SVG + Framer Motion chamber animation. BRIEF §10.3.
 * Illustrates the scrubbing process and door states.
 * - idle: doors resting
 * - scrubbing: inner door closes, per-word flip animation colored by category
 * - sending: outer door opens
 * - local: outer door never opens
 * - blocked: red lamp, doors shut
 * - restoring: reverse flow
 *
 * Respects prefers-reduced-motion: renders static step diagram instead.
 */
export default function AirlockChamber(_props: AirlockChamberProps): React.JSX.Element {
  throw new Error('not implemented: architecture-skeleton');
}
