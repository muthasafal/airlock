import React from 'react';
import RestoredSpan from './RestoredSpan';
import './Turn.css';

interface TurnProps {
  id: string;
  original: string;
  scrubbed: string;
  answer: string;
  restoredSpans?: Array<{
    start: number;
    end: number;
    standIn: string;
    original: string;
  }>;
}

/**
 * Shows one turn: what you wrote, what was sent, the answer restored.
 * BRIEF §P0-6.
 * // TODO(turn): highlight sensitive spans in original and scrubbed
 */
export default function Turn({ id, original, scrubbed, answer, restoredSpans = [] }: TurnProps): React.JSX.Element {
  return (
    <div className="turn" key={id}>
      <div className="turn-section">
        <h3 className="turn-section-title">You wrote</h3>
        <div className="turn-section-content turn-original">
          {original}
        </div>
      </div>

      <div className="turn-section">
        <h3 className="turn-section-title">What was sent (scrubbed)</h3>
        <div className="turn-section-content turn-scrubbed">
          {scrubbed}
        </div>
      </div>

      <div className="turn-section">
        <h3 className="turn-section-title">Answer restored</h3>
        <div className="turn-section-content turn-answer" role="status" aria-live="polite">
          {answer.split(' ').map((word, i) => {
            const restoredSpan = restoredSpans.find(
              (span) => answer.substring(span.start, span.end).includes(word)
            );
            return restoredSpan ? (
              <RestoredSpan
                key={i}
                text={word}
                original={restoredSpan.original}
                standIn={restoredSpan.standIn}
              />
            ) : (
              <span key={i}>{word} </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
