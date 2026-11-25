import React from 'react';
import { motion } from 'framer-motion';
import { EASING, DURATION_NORMAL } from '../../lib/motion';
import './ProtectionStatus.css';

export type ProtectionLevel = 'full' | 'reduced' | 'unavailable';

interface ProtectionStatusProps {
  level: ProtectionLevel;
  downloadProgress?: number; // 0-100 for downloading state
}

/**
 * Shows protection status as plain text, never badge pills.
 * BRIEF §P0-9, design language (plain text status).
 *
 * States:
 * - full: "On-device protection is ready"
 * - reduced: "Protection is reduced (rules only)" with consent toggle
 * - unavailable: "Not available on this browser" with flag guide
 */
export default function ProtectionStatus({ level, downloadProgress = 0 }: ProtectionStatusProps): React.JSX.Element {
  return (
    <div className={`protection-status protection-status--${level}`}>
      {level === 'full' && (
        <>
          <div className="protection-status-icon">✓</div>
          <div className="protection-status-text">
            <p className="protection-status-title">On-device protection is ready</p>
            <p className="protection-status-description">Sensitive details are detected and replaced before anything leaves your device.</p>
          </div>
        </>
      )}

      {level === 'reduced' && (
        <>
          <div className="protection-status-icon">⚠</div>
          <div className="protection-status-text">
            <p className="protection-status-title">Protection is reduced</p>
            <p className="protection-status-description">Using rules only. The on-device model is downloading or not available.</p>
            <p className="protection-status-info">Cloud AI will be called, but you can limit to rules-only detection.</p>
          </div>
        </>
      )}

      {level === 'unavailable' && (
        <>
          <div className="protection-status-icon">✕</div>
          <div className="protection-status-text">
            <p className="protection-status-title">On-device protection not available</p>
            <p className="protection-status-description">This requires Chrome desktop 139 with Gemini Nano.</p>
            <div className="protection-status-steps">
              <ol>
                <li>Use Chrome desktop version 139 or later</li>
                <li>Go to <code>chrome://flags/#prompt-api-for-gemini-nano-multimodal-input</code></li>
                <li>Set it to Enabled</li>
                <li>Restart Chrome</li>
              </ol>
            </div>
          </div>
        </>
      )}

      {downloadProgress > 0 && downloadProgress < 100 && (
        <motion.div
          className="protection-status-progress"
          animate={{ width: `${downloadProgress}%` }}
          transition={{ duration: DURATION_NORMAL, ease: EASING }}
        >
          <span className="protection-status-progress-text">{downloadProgress}%</span>
        </motion.div>
      )}
    </div>
  );
}
