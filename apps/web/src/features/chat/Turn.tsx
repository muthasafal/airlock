import React from 'react';
import type { Finding } from '@airlock/scrub-engine';
import RestoredSpan from './RestoredSpan';
import { toSegments } from './useLivePreview';
import type { RouteDecision } from '../../lib/router';
import './Turn.css';

interface TurnProps {
  id: string;
  original: string;
  originalFindings?: Finding[];
  scrubbed: string;
  answer: string;
  restoredSpans?: Array<{
    start: number;
    end: number;
    standIn: string;
    original: string;
  }>;
  route?: RouteDecision | null;
  reason?: string;
  status?: 'scrubbing' | 'answering' | 'done' | 'blocked' | 'error';
  withheldSecrets?: number;
  canSendWithoutSecret?: boolean;
  needsConsent?: boolean;
  error?: string;
  showStandIns?: boolean;
  onSendWithoutSecret?: () => void;
}

const ROUTE_LABEL: Record<RouteDecision, string> = {
  LOCAL_ANSWER: 'Stayed on your device',
  CLOUD_SCRUBBED: 'Cleaned text went to the cloud',
  BLOCK: 'Held back',
};

/**
 * Shows one turn: what you wrote, what was sent, the answer restored.
 * BRIEF §P0-6. Everything is rendered as text (model output is untrusted).
 */
export default function Turn({
  id,
  original,
  originalFindings = [],
  scrubbed,
  answer,
  restoredSpans = [],
  route,
  reason,
  status = 'done',
  withheldSecrets = 0,
  canSendWithoutSecret = false,
  needsConsent = false,
  error,
  showStandIns = true,
  onSendWithoutSecret,
}: TurnProps): React.JSX.Element {
  const answerParts: React.ReactNode[] = [];
  let at = 0;
  restoredSpans.forEach((span, i) => {
    if (span.start < at) return;
    answerParts.push(answer.slice(at, span.start));
    answerParts.push(
      <RestoredSpan key={`r${i}`} text={answer.slice(span.start, span.end)} original={span.original} standIn={span.standIn} />
    );
    at = span.end;
  });
  answerParts.push(answer.slice(at));

  return (
    <div className="turn" key={id}>
      <div className="turn-section">
        <h3 className="turn-section-title">You wrote</h3>
        <div className="turn-section-content turn-original">
          {toSegments(original, originalFindings).map((s, i) =>
            s.category ? (
              <mark key={i} className="restored-span-highlight" title={s.category.toLowerCase().replace(/_/g, ' ')}>
                {s.text}
              </mark>
            ) : (
              <span key={i}>{s.text}</span>
            )
          )}
        </div>
      </div>

      {showStandIns && (
        <div className="turn-section">
          <h3 className="turn-section-title">
            {route === 'CLOUD_SCRUBBED' ? 'What was sent' : route === 'LOCAL_ANSWER' ? 'Nothing was sent' : 'What would be sent'}
          </h3>
          <div className="turn-section-content turn-scrubbed">
            {status === 'scrubbing' ? 'Cleaning on your device...' : scrubbed}
          </div>
        </div>
      )}

      <div className="turn-section">
        <h3 className="turn-section-title">{route ? ROUTE_LABEL[route] : 'Working on it'}</h3>
        {reason && <p className="turn-section-content">{reason}</p>}
        {withheldSecrets > 0 && route !== 'BLOCK' && (
          <p className="turn-section-content">
            We held back {withheldSecrets} secret{withheldSecrets === 1 ? '' : 's'}. The rest went through.
          </p>
        )}
        {canSendWithoutSecret && onSendWithoutSecret && (
          <button type="button" className="composer-submit-button" onClick={onSendWithoutSecret}>
            Send without the secret
          </button>
        )}
        {needsConsent && (
          <p className="turn-section-content">Turn on reduced protection above, then send again.</p>
        )}
        {error && <p className="turn-section-content">{error}</p>}
        {(status === 'answering' || status === 'done') && (
          <div className="turn-section-content turn-answer" role="status" aria-live="polite">
            {answerParts}
            {status === 'answering' && !answer && 'Waiting for the answer...'}
          </div>
        )}
      </div>
    </div>
  );
}
