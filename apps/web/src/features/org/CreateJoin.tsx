import React, { useState } from 'react';
import './CreateJoin.css';

interface CreateJoinProps {
  onJoined: () => void;
}

export default function CreateJoin({ onJoined }: CreateJoinProps): React.JSX.Element {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = () => {
    if (orgName.trim()) {
      // TODO(create-join): call Firebase org creation
      alert(`TODO: Create org "${orgName}"`);
      onJoined();
    }
  };

  const handleJoin = () => {
    if (inviteCode.trim()) {
      // TODO(create-join): call Firebase org join
      alert(`TODO: Join org with code "${inviteCode}"`);
      onJoined();
    }
  };

  return (
    <div className="create-join">
      {mode === 'choice' && (
        <div className="create-join-choice">
          <button className="create-join-button" onClick={() => setMode('create')}>
            + Create org
          </button>
          <button className="create-join-button" onClick={() => setMode('join')}>
            → Join org
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="create-join-form">
          <label>Organization name:</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Acme Corp"
          />
          <div className="create-join-actions">
            <button className="create-join-submit" onClick={handleCreate} disabled={!orgName.trim()}>
              Create
            </button>
            <button className="create-join-cancel" onClick={() => setMode('choice')}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="create-join-form">
          <label>Invite code:</label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Paste the code your admin shared"
          />
          <div className="create-join-actions">
            <button className="create-join-submit" onClick={handleJoin} disabled={!inviteCode.trim()}>
              Join
            </button>
            <button className="create-join-cancel" onClick={() => setMode('choice')}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
