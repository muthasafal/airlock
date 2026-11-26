import React from 'react';
import { useReducedMotion } from 'framer-motion';
import './AirlockChamber.css';

export type ChamberState = 'idle' | 'scrubbing' | 'sending' | 'local' | 'blocked' | 'restoring';

interface AirlockChamberProps {
  state: ChamberState;
  progress?: number; // kept for API compatibility
}

/** One plain sentence per state, shown under the chamber and announced to screen readers. */
const CHAMBER_CAPTION: Record<ChamberState, string> = {
  idle: 'Both doors shut. Ready when you are.',
  scrubbing: 'Inner door open. Swapping sensitive words, on your device.',
  sending: 'Outer door open. Only stand-ins head to the cloud.',
  local: 'Answered right here. The outer door never opened.',
  blocked: 'Door held shut. A secret stayed on this side.',
  restoring: 'The answer is back. Putting your real details in.',
};

/** Words that flip: what you wrote (blue) and the stand-in that leaves (green). */
const CHIPS = [
  { x: 84, w: 54, original: 'Priya', standIn: 'Maya' },
  { x: 144, w: 76, original: 'Acme Corp', standIn: 'Northwind' },
  { x: 226, w: 52, original: 'sk-ant…', standIn: '‹secret›' },
];

/**
 * The airlock chamber, Airlock's signature (BRIEF §10.3). A dark ink chamber between your
 * device and the cloud. Sensitive words (blue) flip into stand-ins (green) inside it; the
 * outer door opens only for CLOUD_SCRUBBED; LOCAL_ANSWER keeps it shut; BLOCK lights a red
 * lamp. Pure SVG + CSS keyframes on transform and opacity. Under reduced motion it becomes a
 * static four-step diagram with the same caption.
 */
export default function AirlockChamber({ state }: AirlockChamberProps): React.JSX.Element {
  const reduce = useReducedMotion();
  if (reduce) return <StaticChamberDiagram state={state} />;

  const innerOpen = state === 'scrubbing';
  const outerOpen = state === 'sending' || state === 'restoring';
  const showStandIns = state === 'sending' || state === 'local' || state === 'restoring';

  return (
    <figure className={`chamber chamber--${state}`}>
      <svg className="chamber-svg" viewBox="0 0 360 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <clipPath id="chamber-inner-frame">
            <rect x="60" y="44" width="22" height="128" />
          </clipPath>
          <clipPath id="chamber-outer-frame">
            <rect x="282" y="44" width="22" height="128" />
          </clipPath>
          <clipPath id="chamber-room">
            <rect x="82" y="44" width="200" height="128" />
          </clipPath>
        </defs>

        {/* Your device: a small laptop */}
        <g className="chamber-device">
          <rect x="6" y="88" width="40" height="28" rx="5" className="ink-stroke" />
          <rect x="11" y="93" width="30" height="18" rx="2" className="device-screen" />
          <path d="M2 120 h48 l-4 6 h-40 z" className="ink-fill" />
          <text x="26" y="146" className="chamber-label">you</text>
        </g>

        {/* The cloud */}
        <g className="chamber-cloud">
          <path
            d="M318 118 a14 14 0 0 1 2 -27.8 a17 17 0 0 1 31 6.5 a11 11 0 0 1 -1 21.3 z"
            className="cloud-shape"
          />
          <text x="334" y="146" className="chamber-label">cloud</text>
        </g>

        {/* Chamber body */}
        <rect x="54" y="38" width="256" height="140" rx="24" className="chamber-body" />
        <rect x="82" y="44" width="200" height="128" rx="6" className="chamber-room" />
        <line x1="88" y1="160" x2="276" y2="160" className="chamber-floor" />

        {/* Status lamp */}
        <line x1="182" y1="22" x2="182" y2="38" className="lamp-stem" />
        <circle cx="182" cy="18" r="8" className="lamp" />

        {/* Mist sweep while scrubbing */}
        <g clipPath="url(#chamber-room)">
          <rect x="40" y="44" width="70" height="128" className="mist" />
        </g>

        {/* Word chips */}
        {CHIPS.map((c, i) => (
          <g key={c.original} className="chip" style={{ animationDelay: `${i * 0.22}s` }}>
            <g className={`chip-face chip-front ${showStandIns ? 'is-hidden' : ''}`} style={{ animationDelay: `${i * 0.22}s` }}>
              <rect x={c.x} y={86} width={c.w} height={28} rx={14} className={i === 2 ? 'chip-secret' : 'chip-original'} />
              <text x={c.x + c.w / 2} y={104.5} className="chip-text">
                {c.original}
              </text>
            </g>
            <g className={`chip-face chip-back ${showStandIns ? 'is-shown' : ''}`} style={{ animationDelay: `${i * 0.22}s` }}>
              <rect x={c.x} y={86} width={c.w} height={28} rx={14} className="chip-standin" />
              <text x={c.x + c.w / 2} y={104.5} className="chip-text">
                {c.standIn}
              </text>
            </g>
          </g>
        ))}

        {/* The cleaned message travelling to the cloud and back */}
        <g className="parcel">
          <rect x="226" y="128" width="58" height="22" rx="11" className="chip-standin" />
          <text x="255" y="143" className="chip-text chip-text--small">
            cleaned
          </text>
        </g>

        {/* Doors slide up into the wall */}
        <g clipPath="url(#chamber-inner-frame)">
          <g className={`door door-inner ${innerOpen ? 'is-open' : ''}`}>
            <rect x="60" y="44" width="22" height="128" rx="5" className="door-panel" />
            <line x1="71" y1="58" x2="71" y2="158" className="door-seam" />
          </g>
        </g>
        <g clipPath="url(#chamber-outer-frame)">
          <g className={`door door-outer ${outerOpen ? 'is-open' : ''}`}>
            <rect x="282" y="44" width="22" height="128" rx="5" className="door-panel" />
            <line x1="293" y1="58" x2="293" y2="158" className="door-seam" />
          </g>
        </g>
      </svg>
      <figcaption className="chamber-caption" role="status" aria-live="polite">
        {CHAMBER_CAPTION[state]}
      </figcaption>
    </figure>
  );
}

const STEPS = ['You write', 'Cleaned on your device', 'Answered here or in the cloud', 'Real details restored'];
const ACTIVE_STEP: Record<ChamberState, number> = { idle: 0, scrubbing: 1, sending: 2, local: 2, blocked: 2, restoring: 3 };

function StaticChamberDiagram({ state }: { state: ChamberState }): React.JSX.Element {
  return (
    <figure className="static-chamber-diagram">
      <ol className="chamber-steps">
        {STEPS.map((label, i) => (
          <li key={label} className={`chamber-step ${i === ACTIVE_STEP[state] ? 'is-active' : ''}`}>
            <span className="chamber-step-icon" aria-hidden="true">
              {i + 1}
            </span>
            <span className="chamber-step-label">{label}</span>
          </li>
        ))}
      </ol>
      <figcaption className="chamber-caption" role="status" aria-live="polite">
        {CHAMBER_CAPTION[state]}
      </figcaption>
    </figure>
  );
}
