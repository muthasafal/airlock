import React, { useState } from 'react';
import CreateJoin from './CreateJoin';
import PolicyEditor from './PolicyEditor';
import TermsEditor from './TermsEditor';
import StatsDashboard from './StatsDashboard';
import './OrgPage.css';

type OrgTab = 'create' | 'policy' | 'terms' | 'stats';

/**
 * Org admin page: create/join org, set policies, protected terms, stats dashboard.
 * BRIEF §P1-1.
 * // TODO(org-page): integrate with Firebase org mode and Firestore
 */
export default function OrgPage(): React.JSX.Element {
  const [tab, setTab] = useState<OrgTab>('create');
  const [isOrgMember, setIsOrgMember] = useState(false);

  return (
    <div className="org-page">
      <h1 className="org-title">Org Mode</h1>
      <p className="org-description">
        Sign in and join an org to sync protection policies across your team.
      </p>

      {!isOrgMember ? (
        <CreateJoin onJoined={() => setIsOrgMember(true)} />
      ) : (
        <div className="org-tabs-container">
          <div className="org-tabs">
            <button
              className={`org-tab ${tab === 'policy' ? 'active' : ''}`}
              onClick={() => setTab('policy')}
            >
              Policies
            </button>
            <button
              className={`org-tab ${tab === 'terms' ? 'active' : ''}`}
              onClick={() => setTab('terms')}
            >
              Protected Terms
            </button>
            <button
              className={`org-tab ${tab === 'stats' ? 'active' : ''}`}
              onClick={() => setTab('stats')}
            >
              Stats
            </button>
          </div>

          <div className="org-tab-content">
            {tab === 'policy' && <PolicyEditor />}
            {tab === 'terms' && <TermsEditor />}
            {tab === 'stats' && <StatsDashboard />}
          </div>
        </div>
      )}
    </div>
  );
}
