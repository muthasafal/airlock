import React, { useState, useCallback } from 'react';
import AirlockChamber from '../../ui/AirlockChamber/AirlockChamber';
import Composer from './Composer';
import Turn from './Turn';
import ProtectionStatus from '../onboarding/ProtectionStatus';
import { DEMO_CHAT_TURN } from './fixtures';
import './ChatPage.css';

/**
 * Main chat interface with chamber animation beside composer.
 * Shows conversation history with three-column turns (original, scrubbed, answer).
 * BRIEF §P0-6 Airlock Chat.
 * // TODO(chat-page): integrate with real session and scrub engine
 */
export default function ChatPage(): React.JSX.Element {
  const [turns, setTurns] = useState<
    Array<{
      id: string;
      original: string;
      scrubbed: string;
      answer: string;
    }>
  >([]);
  const [chamberState, setChamberState] = useState<'idle' | 'scrubbing' | 'sending' | 'local' | 'blocked' | 'restoring'>('idle');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (text: string, route: 'LOCAL_ANSWER' | 'CLOUD_SCRUBBED') => {
      setIsLoading(true);
      setChamberState('scrubbing');

      // TODO(chat-page): integrate with real scrub engine and AI Logic
      // Simulate the flow
      setTimeout(() => {
        setChamberState(route === 'LOCAL_ANSWER' ? 'local' : 'sending');

        setTimeout(() => {
          setChamberState('restoring');

          // Add a demo turn
          const newTurn = {
            id: `turn-${turns.length + 1}`,
            original: text,
            scrubbed: DEMO_CHAT_TURN.scrubbed,
            answer: DEMO_CHAT_TURN.answer,
          };
          setTurns([...turns, newTurn]);

          setChamberState('idle');
          setIsLoading(false);
        }, 1000);
      }, 1500);
    },
    [turns]
  );

  return (
    <div className="chat-page">
      <ProtectionStatus level="full" />

      <div className="chat-page-container">
        <aside className="chat-page-chamber">
          <div className="chat-chamber-wrapper">
            <AirlockChamber state={chamberState} progress={50} />
          </div>
        </aside>

        <main className="chat-page-main">
          <div className="chat-composer-section">
            <h1 className="chat-title">Airlock Chat</h1>
            <Composer onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          <div className="chat-turns-section" aria-live="polite" aria-label="Chat history">
            {turns.length === 0 ? (
              <div className="chat-empty-state">
                <p>No messages yet. Type something confidential and hit send.</p>
              </div>
            ) : (
              turns.map((turn) => (
                <Turn
                  key={turn.id}
                  id={turn.id}
                  original={turn.original}
                  scrubbed={turn.scrubbed}
                  answer={turn.answer}
                />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
