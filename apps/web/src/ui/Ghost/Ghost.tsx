import React from 'react';
import './Ghost.css';

export type GhostMood = 'calm' | 'wink' | 'boo' | 'sleepy' | 'lost';

/**
 * Airy, the little ghost who guards the airlock door. Hand-drawn SVG in the ink, blue and
 * green palette. Decorative only (aria-hidden); the words next to it carry the meaning.
 */
export function Ghost({ mood = 'calm', size = 64 }: { mood?: GhostMood; size?: number }): React.JSX.Element {
  return (
    <svg
      className={`ghost ghost--${mood}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        className="ghost-body"
        d="M10 30 C10 16 20 7 32 7 C44 7 54 16 54 30 L54 52 C51 56 48 56 45.5 52.5 C43 56 40 56 37.5 52.5 C35 56 32 56 29.5 52.5 C27 56 24 56 21.5 52.5 C19 56 16 56 14 52.5 C12 55 10 54 10 51 Z"
      />
      {/* Cheeks */}
      <ellipse cx="20" cy="34" rx="3.5" ry="2" className="ghost-cheek" />
      <ellipse cx="44" cy="34" rx="3.5" ry="2" className="ghost-cheek" />
      {/* Eyes */}
      {mood === 'sleepy' ? (
        <>
          <path d="M20 27 q4 3 8 0" className="ghost-line" />
          <path d="M36 27 q4 3 8 0" className="ghost-line" />
        </>
      ) : mood === 'wink' ? (
        <>
          <ellipse cx="24" cy="26" rx="3" ry="4" className="ghost-eye" />
          <path d="M36 27 q4 -3 8 0" className="ghost-line" />
        </>
      ) : (
        <>
          <ellipse cx="24" cy="26" rx={mood === 'boo' ? 3.6 : 3} ry={mood === 'boo' ? 4.8 : 4} className="ghost-eye" />
          <ellipse cx="40" cy="26" rx={mood === 'boo' ? 3.6 : 3} ry={mood === 'boo' ? 4.8 : 4} className="ghost-eye" />
        </>
      )}
      {/* Mouth */}
      {mood === 'boo' ? (
        <ellipse cx="32" cy="38" rx="4" ry="5" className="ghost-eye" />
      ) : mood === 'lost' ? (
        <path d="M27 40 q5 -4 10 0" className="ghost-line" />
      ) : mood === 'sleepy' ? (
        <path d="M29 38 h6" className="ghost-line" />
      ) : (
        <path d="M27 36 q5 5 10 0" className="ghost-line" />
      )}
      {mood === 'sleepy' && (
        <text x="50" y="12" className="ghost-z">
          z
        </text>
      )}
    </svg>
  );
}

/**
 * Airy with a speech bubble: one line of mischief and one clear next step (the `children`, an
 * action button or link). Used for empty states, blocked messages, a stuck model and the 404.
 */
export default function GhostTip({
  mood = 'calm',
  children,
  action,
  compact = false,
}: {
  mood?: GhostMood;
  children: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}): React.JSX.Element {
  return (
    <div className={`ghost-tip ${compact ? 'ghost-tip--compact' : ''} ghost-tip--${mood}`}>
      <Ghost mood={mood} size={compact ? 44 : 64} />
      <div className="ghost-bubble">
        <div className="ghost-bubble-text">{children}</div>
        {action && <div className="ghost-bubble-action">{action}</div>}
      </div>
    </div>
  );
}
