import React, { useState } from 'react';
import './RestoredSpan.css';

interface RestoredSpanProps {
  text: string;
  original: string;
  standIn: string;
}

/**
 * Highlighted span in the answer showing a restored value.
 * Tooltip on hover: "restored on your device" with original value.
 * BRIEF §P0-6.
 */
export default function RestoredSpan({ text, original, standIn }: RestoredSpanProps): React.JSX.Element {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className="restored-span"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)}
      onTouchEnd={() => setShowTooltip(false)}
      aria-label={`${text} restored on your device from ${standIn}`}
    >
      <mark className="restored-span-highlight">{text}</mark>
      {showTooltip && (
        <div className="restored-span-tooltip" role="tooltip">
          <p className="restored-span-tooltip-label">Restored on your device</p>
          <p className="restored-span-tooltip-value">{original}</p>
          <p className="restored-span-tooltip-standIn">(was {standIn})</p>
        </div>
      )}
    </span>
  );
}
