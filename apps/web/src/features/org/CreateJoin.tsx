import React, { useState } from 'react';
import './CreateJoin.css';

interface CreateJoinProps {
  onCreate: (name: string) => void;
  onJoin: (orgId: string, inviteCode: string) => void;
}

/** Create an org (you become its admin) or join one with its ID and invite code. BRIEF §P1-1. */
export default function CreateJoin({ onCreate, onJoin }: CreateJoinProps): React.JSX.Element {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [inviteCode, setInviteCode] = useState('');

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
          <label htmlFor="org-name">Organization name:</label>
          <input id="org-name" type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Northwind Labs" />
          <div className="create-join-actions">
            <button className="create-join-submit" onClick={() => onCreate(orgName)} disabled={!orgName.trim()}>
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
          <label htmlFor="org-id">Org ID:</label>
          <input id="org-id" type="text" value={orgId} onChange={(e) => setOrgId(e.target.value)} placeholder="From your admin" />
          <label htmlFor="org-code">Invite code:</label>
          <input id="org-code" type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Paste the code your admin shared" />
          <div className="create-join-actions">
            <button className="create-join-submit" onClick={() => onJoin(orgId, inviteCode)} disabled={!orgId.trim() || !inviteCode.trim()}>
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
