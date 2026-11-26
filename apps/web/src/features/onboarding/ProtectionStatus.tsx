import React from 'react';
import { motion } from 'framer-motion';
import { EASING, DURATION_NORMAL } from '../../lib/motion';
import EnableNanoButton from './EnableNanoButton';
import './ProtectionStatus.css';

export type ProtectionLevel = 'full' | 'reduced' | 'unavailable';

interface ProtectionStatusProps {
  level: ProtectionLevel;
  downloadProgress?: number; // 0-100 for downloading state
  availability?: 'available' | 'downloadable' | 'downloading' | 'unavailable';
  firebaseConfigured?: boolean;
  onEnable?: () => void;
  enabling?: boolean;
  consent?: boolean;
  onConsentChange?: (v: boolean) => void;
  /** Nano is installed but not responding (Chrome's on-device model service is stuck). */
  stalled?: boolean;
}

/**
 * Shows protection status as plain text, never badge pills.
 * BRIEF §P0-9, §10.4 copy, design language (plain text status).
 *
 * States:
 * - full: "On-device protection is ready"
 * - reduced: model downloadable or downloading, with the Enable button and progress
 * - unavailable: "not available on this browser" with the flag guide and the consent toggle
 */
export default function ProtectionStatus({
  level,
  downloadProgress = 0,
  availability,
  firebaseConfigured = true,
  onEnable,
  enabling = false,
  consent = false,
  onConsentChange,
  stalled = false,
}: ProtectionStatusProps): React.JSX.Element {
  return (
    <div className={`protection-status protection-status--${level}`} role="status" aria-live="polite">
      {level === 'full' && (
        <>
          <div className="protection-status-icon">✓</div>
          <div className="protection-status-text">
            <p className="protection-status-title">On-device protection is ready</p>
            <p className="protection-status-description">Your secrets stay on this laptop. Sensitive details are found and swapped before anything leaves.</p>
          </div>
        </>
      )}

      {level === 'reduced' && (
        <>
          <div className="protection-status-icon">⚠</div>
          <div className="protection-status-text">
            <p className="protection-status-title">
              {stalled
                ? "On-device protection: the private model isn't responding"
                : availability === 'downloading' || enabling
                  ? `On-device protection: downloading ${downloadProgress}%`
                  : 'On-device protection: ready to download'}
            </p>
            <p className="protection-status-description">
              {stalled
                ? 'Chrome has the model but its on-device service is stuck. Quit Chrome completely (every window) and open it again. Until then we use our rule checks and ask before anything is sent.'
                : "Until the private model is ready we use our rule checks only, and you'll be asked before anything is sent."}
            </p>
            {onEnable && !enabling && availability === 'downloadable' && <EnableNanoButton onClick={onEnable} />}
            {onConsentChange && <ConsentToggle consent={consent} onChange={onConsentChange} />}
          </div>
        </>
      )}

      {level === 'unavailable' && (
        <>
          <div className="protection-status-icon">✕</div>
          <div className="protection-status-text">
            <p className="protection-status-title">On-device protection: not available on this browser (reduced protection)</p>
            <p className="protection-status-description">
              {firebaseConfigured
                ? "This browser can't run the private model, so we're using our rule checks only. You'll be asked before anything is sent."
                : "This copy of Airlock isn't connected to Firebase yet, so it runs our rule checks only and can't call any AI model."}
            </p>
            <div className="protection-status-steps">
              <ol>
                <li>Use Chrome desktop version 139 or later</li>
                <li>Go to <code>chrome://flags/#prompt-api-for-gemini-nano-multimodal-input</code></li>
                <li>Set it to Enabled</li>
                <li>Restart Chrome</li>
              </ol>
            </div>
            {onConsentChange && firebaseConfigured && <ConsentToggle consent={consent} onChange={onConsentChange} />}
          </div>
        </>
      )}

      {downloadProgress > 0 && downloadProgress < 100 && (
        <motion.div
          className="protection-status-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={downloadProgress}
          animate={{ width: `${downloadProgress}%` }}
          transition={{ duration: DURATION_NORMAL, ease: EASING }}
        >
          <span className="protection-status-progress-text">{downloadProgress}%</span>
        </motion.div>
      )}
    </div>
  );
}

function ConsentToggle({ consent, onChange }: { consent: boolean; onChange: (v: boolean) => void }): React.JSX.Element {
  return (
    <label className="protection-status-info">
      <input type="checkbox" checked={consent} onChange={(e) => onChange(e.target.checked)} /> Send rule-cleaned text to the
      cloud for this session (reduced protection)
    </label>
  );
}
