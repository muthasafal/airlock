import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { EASING } from '../../lib/motion';
import './AirlockChamber.css';

export type ChamberState =
  | 'idle'
  | 'scrubbing'
  | 'sending'
  | 'local'
  | 'blocked'
  | 'restoring';

interface AirlockChamberProps {
  state: ChamberState;
  progress?: number; // 0-1 for scrubbing/sending animations
}

/**
 * Animated two-door airlock chamber showing the scrubbing process.
 * BRIEF §8 and design language §signature element.
 *
 * States:
 * - idle: both doors closed, waiting
 * - scrubbing: inner door open, mist sweeps, words flip colored by category
 * - sending: outer door opens, cleaned message drifts toward cloud
 * - local: outer door stays closed ("stayed on your device")
 * - blocked: gentle red lamp pulses, doors stay shut
 * - restoring: reverse animation
 *
 * In reduced-motion mode: static step diagram with text labels.
 */
export default function AirlockChamber({ state }: AirlockChamberProps): React.JSX.Element {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <StaticChamberDiagram state={state} />;
  }

  return <AnimatedChamber state={state} />;
}

function AnimatedChamber({ state }: { state: ChamberState }): React.JSX.Element {
  return (
    <svg
      className="airlock-chamber-svg"
      viewBox="0 0 320 240"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Airlock chamber: ${state}`}
    >
      {/* Chamber body */}
      <rect
        x="20"
        y="40"
        width="280"
        height="140"
        fill="var(--color-sky-50)"
        stroke="var(--color-slate-300)"
        strokeWidth="2"
        rx="12"
      />

      {/* Inner door (device side, left) */}
      <motion.g
        animate={{
          rotateZ: state === 'idle' || state === 'blocked' ? 0 : state === 'scrubbing' || state === 'restoring' ? -70 : 0,
        }}
        transition={{ duration: 0.4, ease: EASING }}
        style={{ transformOrigin: '30px 110px' }}
      >
        <rect
          x="20"
          y="40"
          width="20"
          height="140"
          fill="var(--color-sky-300)"
          stroke="var(--color-slate-400)"
          strokeWidth="1.5"
          rx="4"
        />
        <line x1="30" y1="55" x2="30" y2="165" stroke="var(--color-slate-500)" strokeWidth="0.5" opacity="0.6" />
      </motion.g>

      {/* Outer door (cloud side, right) */}
      <motion.g
        animate={{
          rotateZ:
            state === 'idle' || state === 'blocked' || state === 'local' || state === 'scrubbing' ? 0 : 70,
        }}
        transition={{ duration: 0.4, ease: EASING, delay: state === 'sending' ? 0.2 : 0 }}
        style={{ transformOrigin: '290px 110px' }}
      >
        <rect
          x="280"
          y="40"
          width="20"
          height="140"
          fill="var(--color-sky-300)"
          stroke="var(--color-slate-400)"
          strokeWidth="1.5"
          rx="4"
        />
        <line x1="290" y1="55" x2="290" y2="165" stroke="var(--color-slate-500)" strokeWidth="0.5" opacity="0.6" />
      </motion.g>

      {/* Mist animation (scrubbing) */}
      {state === 'scrubbing' && (
        <motion.g
          animate={{ x: [-40, 40, -40], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ellipse cx="160" cy="110" rx="60" ry="45" fill="var(--color-sky-400)" />
        </motion.g>
      )}

      {/* Word chips (scrubbing state) */}
      {state === 'scrubbing' && (
        <>
          <motion.g
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ duration: 0.7, ease: EASING, repeat: Infinity, repeatDelay: 0.1 }}
            style={{ transformOrigin: '100px 110px' }}
          >
            <rect
              x="85"
              y="100"
              width="30"
              height="20"
              rx="6"
              fill="var(--color-category-person)"
              opacity="0.9"
            />
            <text x="100" y="114" fontSize="10" fontWeight="600" fill="white" textAnchor="middle">
              Priya
            </text>
          </motion.g>

          <motion.g
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ duration: 0.7, ease: EASING, repeat: Infinity, repeatDelay: 0.3 }}
            style={{ transformOrigin: '160px 110px' }}
          >
            <rect
              x="145"
              y="100"
              width="30"
              height="20"
              rx="6"
              fill="var(--color-category-org)"
              opacity="0.9"
            />
            <text x="160" y="114" fontSize="10" fontWeight="600" fill="white" textAnchor="middle">
              Acme
            </text>
          </motion.g>

          <motion.g
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ duration: 0.7, ease: EASING, repeat: Infinity, repeatDelay: 0.5 }}
            style={{ transformOrigin: '220px 110px' }}
          >
            <rect
              x="205"
              y="100"
              width="30"
              height="20"
              rx="6"
              fill="var(--color-category-credential)"
              opacity="0.9"
            />
            <text x="220" y="114" fontSize="9" fontWeight="600" fill="white" textAnchor="middle">
              key...
            </text>
          </motion.g>
        </>
      )}

      {/* Cloud (sending state) */}
      {state === 'sending' && (
        <motion.g
          animate={{ x: [0, 50, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
        >
          <ellipse cx="310" cy="50" rx="22" ry="15" fill="var(--color-sky-200)" opacity="0.8" />
          <ellipse cx="335" cy="45" rx="25" ry="18" fill="var(--color-sky-200)" opacity="0.8" />
        </motion.g>
      )}

      {/* Red lamp (blocked state) */}
      {state === 'blocked' && (
        <motion.circle
          cx="160"
          cy="110"
          r="16"
          fill="var(--color-red-500)"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Status text */}
      <text x="160" y="210" fontSize="11" fontWeight="600" textAnchor="middle" fill="var(--color-slate-700)">
        {state === 'idle' && 'Ready'}
        {state === 'scrubbing' && 'Scrubbing...'}
        {state === 'sending' && 'Sending'}
        {state === 'local' && 'On your device'}
        {state === 'blocked' && 'Blocked'}
        {state === 'restoring' && 'Restoring...'}
      </text>
    </svg>
  );
}

function StaticChamberDiagram({ state }: { state: ChamberState }): React.JSX.Element {
  const steps = [
    { label: 'Your message', icon: '📝' },
    { label: 'Scrubbed', icon: '✨' },
    { label: 'On-device or cloud', icon: '🌐' },
    { label: 'Answer restored', icon: '✅' },
  ];

  return (
    <div className="static-chamber-diagram">
      <div className="chamber-steps">
        {steps.map((step, i) => (
          <div key={i} className="chamber-step">
            <div className="chamber-step-icon">{step.icon}</div>
            <div className="chamber-step-label">{step.label}</div>
          </div>
        ))}
      </div>
      <div className="chamber-status-label">{state}</div>
    </div>
  );
}
