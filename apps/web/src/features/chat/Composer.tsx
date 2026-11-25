import React, { useState, useCallback } from 'react';
import RoutePicker from './RoutePicker';
import type { RouteOverride } from '../../lib/router';
import type { PreviewSegment } from './useLivePreview';
import './Composer.css';

interface ComposerProps {
  onSubmit: (text: string, route: RouteOverride) => void;
  onTextChange?: (text: string) => void;
  isLoading?: boolean;
  /** Live redaction preview: plain and sensitive segments, rendered as text (never HTML). */
  previewSegments?: PreviewSegment[];
}

/**
 * Message composer with live redaction preview (highlighted sensitive spans).
 * Route override picker (automatic, device-only or cloud).
 * BRIEF §P0-6.
 */
export default function Composer({ onSubmit, onTextChange, isLoading = false, previewSegments = [] }: ComposerProps): React.JSX.Element {
  const [text, setText] = useState('');
  const [route, setRoute] = useState<RouteOverride>('AUTO');

  const change = (value: string) => {
    setText(value);
    onTextChange?.(value);
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (text.trim() && !isLoading) {
        onSubmit(text, route);
        setText('');
        onTextChange?.('');
      }
    },
    [text, route, isLoading, onSubmit, onTextChange]
  );

  const sensitive = previewSegments.filter((s) => s.category).length;

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer-input-wrapper">
        <textarea
          className="composer-input"
          value={text}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(e);
          }}
          placeholder="Paste confidential material here. Names, emails, API keys, any sensitive info. Airlock will protect it."
          disabled={isLoading}
          aria-label="Message input"
        />
        {sensitive > 0 && (
          <div className="composer-preview" aria-live="polite">
            <p className="composer-preview-label">
              Live preview: {sensitive} sensitive detail{sensitive === 1 ? '' : 's'} will be swapped before sending
            </p>
            <div className="composer-preview-text">
              {previewSegments.map((s, i) =>
                s.category ? (
                  <mark key={i} title={s.category.toLowerCase().replace(/_/g, ' ')}>
                    {s.text}
                  </mark>
                ) : (
                  <span key={i}>{s.text}</span>
                )
              )}
            </div>
          </div>
        )}
      </div>

      <div className="composer-controls">
        <RoutePicker route={route} onChange={setRoute} />
        <button
          type="submit"
          className="composer-submit-button"
          disabled={!text.trim() || isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
}
