import React, { useState } from 'react';
import RestoredSpan from '../chat/RestoredSpan';
import { useClipboardAirlock } from './useClipboardAirlock';
import './ClipboardAirlock.css';

/**
 * Clipboard airlock: clean, copy, paste answer, restore.
 * Works with any AI product, on the same session mapping as the chat. BRIEF §P0-8.
 */
export default function ClipboardAirlock(): React.JSX.Element {
  const clip = useClipboardAirlock();
  const [phase, setPhase] = useState<'input' | 'restored'>('input');
  const [inputText, setInputText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [restored, setRestored] = useState<ReturnType<typeof clip.restore> | null>(null);

  const handleRestore = () => {
    setRestored(clip.restore(answerText));
    setPhase('restored');
  };

  const parts: React.ReactNode[] = [];
  if (restored) {
    let at = 0;
    restored.restoredSpans.forEach((s, i) => {
      parts.push(restored.text.slice(at, s.start));
      parts.push(<RestoredSpan key={i} text={restored.text.slice(s.start, s.end)} original={s.original} standIn={s.standIn} />);
      at = s.end;
    });
    parts.push(restored.text.slice(at));
  }

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
            aria-label="Text to clean"
          />
          <button className="clipboard-button" onClick={() => void clip.cleanAndCopy(inputText)} disabled={!inputText.trim() || clip.busy}>
            {clip.busy ? 'Cleaning...' : 'Clean and copy'}
          </button>
          {clip.status && (
            <p className="clipboard-hint" role="status" aria-live="polite">
              {clip.status}
            </p>
          )}
          {clip.cleaned && <div className="clipboard-restored-output">{clip.cleaned}</div>}
          <p className="clipboard-hint">
            Now paste the cleaned text into any AI tool. Get your answer, then paste it here to restore your real details.
          </p>
          <textarea
            className="clipboard-answer-input"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Paste the AI's answer here..."
            aria-label="The AI's answer"
          />
          <button className="clipboard-button" onClick={handleRestore} disabled={!answerText.trim()}>
            Restore
          </button>
        </div>
      )}

      {phase === 'restored' && (
        <div className="clipboard-step">
          <h2>Restored answer</h2>
          <div className="clipboard-restored-output">{parts}</div>
          <p className="clipboard-hint">
            {restored && restored.restoredSpans.length > 0
              ? `We put back ${restored.restoredSpans.length} real detail${restored.restoredSpans.length === 1 ? '' : 's'}, right here on your device.`
              : 'No stand-ins found. Was this answer from a text you cleaned in this session?'}
          </p>
          <button className="clipboard-button" onClick={() => void (restored && navigator.clipboard.writeText(restored.text))}>
            Copy restored answer
          </button>
          <button
            className="clipboard-button"
            onClick={() => {
              setPhase('input');
              setInputText('');
              setAnswerText('');
              setRestored(null);
            }}
          >
            Clear and start over
          </button>
        </div>
      )}
    </div>
  );
}
