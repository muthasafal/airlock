import React, { useState } from 'react';
import { ALL_CATEGORIES, DEFAULT_POLICY, type Action } from '@airlock/scrub-engine';
import { useSettings } from './useSettings';
import { CLOUD_MODEL_OPTIONS, NANO_WAIT_OPTIONS, type CloudModelChoice } from '../../lib/settings';
import './SettingsPage.css';

const ACTIONS: Action[] = ['PSEUDONYMIZE', 'GENERALIZE', 'BLOCK', 'KEEP'];
const ACTION_LABEL: Record<Action, string> = {
  PSEUDONYMIZE: 'Swap for a stand-in',
  GENERALIZE: 'Generalise',
  BLOCK: 'Hold back',
  KEEP: 'Keep as is',
};
const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

/**
 * Settings page: session TTL, category defaults, show stand-ins, export/delete data, language.
 * BRIEF §P1-3. Values live in localStorage via useSettings.
 */
export default function SettingsPage(): React.JSX.Element {
  const { settings, update, exportLocalData, deleteLocalData } = useSettings();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState('');

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>

      <div className="settings-section">
        <h2 className="settings-section-title">Session</h2>
        <div className="settings-field">
          <label htmlFor="session-ttl">Keep session mappings for:</label>
          <div className="settings-field-row">
            <input
              id="session-ttl"
              type="number"
              min="1"
              max="168"
              value={settings.sessionTtlHours}
              onChange={(e) => update({ sessionTtlHours: Math.min(168, Math.max(1, Number(e.target.value) || 24)) })}
            />
            <span>hours</span>
          </div>
          <p className="settings-field-help">Default is 24 hours. After this time, local session mappings are deleted automatically.</p>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Models</h2>
        <div className="settings-field">
          <label htmlFor="cloud-model">Cloud model for answers:</label>
          <select
            id="cloud-model"
            value={settings.cloudModel}
            onChange={(e) => update({ cloudModel: e.target.value as CloudModelChoice })}
          >
            {CLOUD_MODEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="settings-field-help">It only ever sees the cleaned text with stand-ins, whichever you pick.</p>
        </div>
        <div className="settings-field">
          <label htmlFor="nano-wait">Give the private on-device model up to:</label>
          <select
            id="nano-wait"
            value={settings.nanoWaitSeconds}
            onChange={(e) => update({ nanoWaitSeconds: Number(e.target.value) })}
          >
            {NANO_WAIT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s} seconds{s === 8 ? ' (quick)' : s === 20 ? ' (default)' : ' (thorough, slower laptops)'}
              </option>
            ))}
          </select>
          <p className="settings-field-help">
            Gemini Nano checks every message on this laptop before anything leaves. If it takes longer than this, we fall back to our rule
            checks and ask you before sending.
          </p>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">What to do with each kind of detail</h2>
        {ALL_CATEGORIES.map((c) => (
          <div className="settings-field" key={c}>
            <label htmlFor={`cat-${c}`}>{label(c)}</label>
            <select
              id={`cat-${c}`}
              value={settings.categoryOverrides[c] ?? DEFAULT_POLICY[c]}
              onChange={(e) => {
                const value = e.target.value as Action;
                const next = { ...settings.categoryOverrides };
                if (value === DEFAULT_POLICY[c]) delete next[c];
                else next[c] = value;
                update({ categoryOverrides: next });
              }}
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABEL[a]}
                  {a === DEFAULT_POLICY[c] ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </div>
        ))}
        <p className="settings-field-help">An org policy, if you join one, takes priority over these.</p>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Display</h2>
        <div className="settings-field">
          <label htmlFor="show-standins">
            <input
              id="show-standins"
              type="checkbox"
              checked={settings.showStandIns}
              onChange={(e) => update({ showStandIns: e.target.checked })}
            />
            Show what was sent (the stand-in version) in chat
          </label>
          <p className="settings-field-help">Turn this off to see only what you wrote and the restored answer.</p>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Language</h2>
        <div className="settings-field">
          <label htmlFor="language">UI language:</label>
          <select id="language" value={settings.language} onChange={(e) => update({ language: e.target.value })}>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Data</h2>
        <div className="settings-actions">
          <button className="settings-action-button" onClick={() => void exportLocalData()}>
            Export data
          </button>
          {!confirming ? (
            <button className="settings-action-button settings-action-button--danger" onClick={() => setConfirming(true)}>
              Delete all data
            </button>
          ) : (
            <button
              className="settings-action-button settings-action-button--danger"
              onClick={() =>
                void deleteLocalData().then(() => {
                  setConfirming(false);
                  setDone('Done. Sessions, receipts and settings on this device are gone.');
                })
              }
            >
              Yes, delete sessions, receipts and settings
            </button>
          )}
        </div>
        <p className="settings-field-help" role="status">
          {done || 'All your data is stored locally on this device. Export to back it up. Delete to clear everything.'}
        </p>
      </div>
    </div>
  );
}
