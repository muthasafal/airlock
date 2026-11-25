import React, { useState } from 'react';
import './ClipboardAirlock.css';

/**
 * Clipboard airlock: clean, copy, paste answer, restore.
 * BRIEF §P0-8.
 * // TODO(clipboard): implement clipboard operations and restore
 */
export default function ClipboardAirlock(): React.JSX.Element {
  const [phase, setPhase] = useState<'input' | 'restored'>('input');
  const [inputText, setInputText] = useState('');
  const [restoredText, setRestoredText] = useState('');

  const handleCleanAndCopy = async () => {
    // TODO(clipboard): scrub text and copy to clipboard
    alert('TODO: Scrub and copy to clipboard');
  };

  const handleRestore = async () => {
    // TODO(clipboard): restore from mapping
    setPhase('restored');
  };

  return (
    <div className="clipboard-airlock">
      <h1 className="clipboard-title">Clipboard Airlock</h1>
      <p className="clipboard-description">
        Clean sensitive text and copy it to paste into any AI tool, then restore your real details when you get the answer back.
      </p>

      {phase === 'input' && (
        <div className="clipboard-step">
          <h2>Step 1: Clean and copy</h2>
          <textarea
            className="clipboard-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste confidential text here..."
          />
          <button className="clipboard-button" onClick={handleCleanAndCopy}>
            Clean and copy
          </button>
          <p className="clipboard-hint">
            Now paste this cleaned text into ChatGPT, Claude, or any AI tool. Get your answer, then paste it here to restore your real details.
          </p>
          <textarea
            className="clipboard-answer-input"
            onChange={(e) => setRestoredText(e.target.value)}
            placeholder="Paste the AI's answer here..."
          />
          <button className="clipboard-button" onClick={handleRestore} disabled={!restoredText.trim()}>
            Restore
          </button>
        </div>
      )}

      {phase === 'restored' && (
        <div className="clipboard-step">
          <h2>Restored answer</h2>
          <div className="clipboard-restored-output">
            {restoredText}
          </div>
          <button className="clipboard-button" onClick={() => { setPhase('input'); setInputText(''); setRestoredText(''); }}>
            Clear and start over
          </button>
        </div>
      )}
    </div>
  );
}
