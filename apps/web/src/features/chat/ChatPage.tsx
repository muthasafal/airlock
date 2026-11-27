import React, { useState } from 'react';
import AirlockChamber from '../../ui/AirlockChamber/AirlockChamber';
import Composer from './Composer';
import Turn from './Turn';
import ProtectionStatus from '../onboarding/ProtectionStatus';
import { useAirlockSession } from './useAirlockSession';
import { useLivePreview } from './useLivePreview';
import { useProtectionStatus } from '../onboarding/useProtectionStatus';
import { useSettings } from '../settings/useSettings';
import GhostTip from '../../ui/Ghost/Ghost';
import './ChatPage.css';

/**
 * Main chat interface with chamber animation beside composer.
 * Shows conversation history with three-column turns (original, scrubbed, answer).
 * BRIEF §P0-6 Airlock Chat. Container only: state comes from useAirlockSession.
 */
export default function ChatPage(): React.JSX.Element {
  const session = useAirlockSession();
  const status = useProtectionStatus();
  const { settings } = useSettings();
  const [draft, setDraft] = useState('');
  const preview = useLivePreview(draft);

  return (
    <div className="chat-page">
      <ProtectionStatus
        level={status.level}
        downloadProgress={status.initProgress ?? 0}
        availability={status.availability}
        firebaseConfigured={status.firebaseConfigured}
        onEnable={status.startInit}
            stalled={status.stalled}
        enabling={status.initProgress !== null}
        consent={session.consent}
        onConsentChange={session.setConsent}
      />

      <div className="chat-page-container">
        <aside className="chat-page-chamber">
          <div className="chat-chamber-wrapper">
            <AirlockChamber state={session.chamberState} progress={50} />
          </div>
        </aside>

        <main className="chat-page-main">
          <div className="chat-composer-section">
            <h1 className="chat-title">Airlock Chat</h1>
            <Composer
              onSubmit={(text, route) => void session.submit(text, route)}
              onTextChange={setDraft}
              isLoading={session.busy}
              previewSegments={preview}
            />
            {session.turns.length > 0 && (
              <button type="button" className="chat-forget-button" onClick={session.forgetSession}>
                Forget this session
              </button>
            )}
          </div>

          <div className="chat-turns-section" aria-live="polite" aria-label="Chat history">
            {session.turns.length === 0 ? (
              <div className="chat-empty-state">
                <GhostTip mood="wink">
                  Nothing in the airlock yet. Paste an email you'd never forward to a stranger and press Send. I'll swap the names,
                  numbers and keys before a single word leaves this laptop.
                </GhostTip>
              </div>
            ) : (
              session.turns.map((turn) => (
                <Turn
                  key={turn.id}
                  id={turn.id}
                  original={turn.original}
                  originalFindings={turn.originalFindings}
                  scrubbed={turn.scrubbed}
                  answer={turn.answer}
                  restoredSpans={turn.restoredSpans}
                  route={turn.route}
                  reason={turn.reason}
                  status={turn.status}
                  withheldSecrets={turn.withheldSecrets}
                  canSendWithoutSecret={turn.canSendWithoutSecret}
                  needsConsent={turn.needsConsent}
                  error={turn.error}
                  showStandIns={settings.showStandIns}
                  onSendWithoutSecret={() => void session.sendWithoutSecret(turn.id)}
                />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
