import React, { useState } from 'react';
import './SettingsPage.css';

/**
 * Settings page: session TTL, category defaults, show stand-ins, export/delete data, language.
 * BRIEF §P1-3.
 * // TODO(settings): implement settings hooks and local storage
 */
export default function SettingsPage(): React.JSX.Element {
  const [sessionTtl, setSessionTtl] = useState(24);
  const [showStandIns, setShowStandIns] = useState(false);
  const [language, setLanguage] = useState('en');

  const handleExport = () => {
    // TODO(settings): export all data as JSON
    alert('TODO: Export data');
  };

  const handleDelete = () => {
    if (confirm('Delete all local data, including sessions and receipts?')) {
      // TODO(settings): call forgetAll() on vault
      alert('TODO: Delete all data');
    }
  };

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
              value={sessionTtl}
              onChange={(e) => setSessionTtl(Number(e.target.value))}
            />
            <span>hours</span>
          </div>
          <p className="settings-field-help">Default is 24 hours. After this time, local session mappings are deleted automatically.</p>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Display</h2>
        <div className="settings-field">
          <label htmlFor="show-standins">
            <input
              id="show-standins"
              type="checkbox"
              checked={showStandIns}
              onChange={(e) => setShowStandIns(e.target.checked)}
            />
            Show stand-in values in chat
          </label>
          <p className="settings-field-help">When enabled, you will see both the original and the stand-in in messages.</p>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Language</h2>
        <div className="settings-field">
          <label htmlFor="language">UI language:</label>
          <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Data</h2>
        <div className="settings-actions">
          <button className="settings-action-button" onClick={handleExport}>
            ↓ Export data
          </button>
          <button className="settings-action-button settings-action-button--danger" onClick={handleDelete}>
            ✕ Delete all data
          </button>
        </div>
        <p className="settings-field-help">
          All your data is stored locally on this device. Export to back it up. Delete to clear everything.
        </p>
      </div>
    </div>
  );
}
