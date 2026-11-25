import React, { useState, useCallback } from 'react';
import RoutePicker from './RoutePicker';
import './Composer.css';

interface ComposerProps {
  onSubmit: (text: string, route: 'LOCAL_ANSWER' | 'CLOUD_SCRUBBED') => void;
  isLoading?: boolean;
  redactionPreview?: string;
}

/**
 * Message composer with live redaction preview (highlighted sensitive spans).
 * Route override picker (device-only or cloud).
 * BRIEF §P0-6.
 * // TODO(composer): integrate live preview from scrub engine on 300ms debounce
 */
export default function Composer({ onSubmit, isLoading = false, redactionPreview }: ComposerProps): React.JSX.Element {
  const [text, setText] = useState('');
  const [route, setRoute] = useState<'LOCAL_ANSWER' | 'CLOUD_SCRUBBED'>('CLOUD_SCRUBBED');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (text.trim() && !isLoading) {
        onSubmit(text, route);
        setText('');
      }
    },
    [text, route, isLoading, onSubmit]
  );

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer-input-wrapper">
        <textarea
          className="composer-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste confidential material here. Names, emails, API keys, any sensitive info. Airlock will protect it."
          disabled={isLoading}
          aria-label="Message input"
        />
        {redactionPreview && (
          <div className="composer-preview">
            <p className="composer-preview-label">Live preview (sensitive highlighted)</p>
            <div className="composer-preview-text" dangerouslySetInnerHTML={{ __html: redactionPreview }} />
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
