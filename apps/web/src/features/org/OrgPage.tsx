import React, { useState } from 'react';
import CreateJoin from './CreateJoin';
import PolicyEditor from './PolicyEditor';
import TermsEditor from './TermsEditor';
import StatsDashboard from './StatsDashboard';
import { useOrg } from './useOrg';
import './OrgPage.css';

type OrgTab = 'policy' | 'terms' | 'stats';

/**
 * Org admin page: sign in, create/join org, set policies, protected terms, stats dashboard.
 * Members only pull the policy; it is applied on their device. BRIEF §P1-1.
 */
export default function OrgPage(): React.JSX.Element {
  const o = useOrg();
  const [tab, setTab] = useState<OrgTab>('policy');

  if (!o.configured) {
    return (
      <div className="org-page">
        <h1 className="org-title">Org Mode</h1>
        <p className="org-description">Org mode needs this copy of Airlock to be connected to Firebase.</p>
      </div>
    );
  }

  return (
    <div className="org-page">
      <h1 className="org-title">Org Mode</h1>
      <p className="org-description">
        Sign in and join an org to share protected terms and policies with your team. Your org only ever sees counts, never what anyone wrote.
      </p>

      {!o.user ? (
        <div className="create-join-choice">
          <button className="create-join-button" onClick={() => void o.signIn()}>
            Sign in with Google
          </button>
        </div>
      ) : !o.org ? (
        <CreateJoin onCreate={(name) => void o.create(name)} onJoin={(id, code) => void o.join(id, code)} />
      ) : (
        <div className="org-tabs-container">
          <p className="org-description">
            {o.org.name}: you are {o.org.role === 'admin' ? 'an admin' : 'a member'}. Org ID <code>{o.org.orgId}</code>
            {o.inviteCode && (
              <>
                {' '}
                and invite code <code>{o.inviteCode}</code>. Share both with your team; we only keep a hash of the code, so save it now.
              </>
            )}
          </p>
          {o.org.role === 'admin' ? (
            <>
              <div className="org-tabs" role="tablist">
                {(['policy', 'terms', 'stats'] as OrgTab[]).map((t) => (
                  <button key={t} role="tab" aria-selected={tab === t} className={`org-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                    {t === 'policy' ? 'Policies' : t === 'terms' ? 'Protected terms' : 'Stats'}
                  </button>
                ))}
              </div>
              <div className="org-tab-content">
                {tab === 'policy' && <PolicyEditor policy={o.org.policy} onSave={(p) => void o.savePolicy(p, o.org!.protectedTerms)} />}
                {tab === 'terms' && <TermsEditor terms={o.org.protectedTerms} onSave={(t) => void o.savePolicy(o.org!.policy, t)} />}
                {tab === 'stats' && <StatsDashboard load={o.loadStats} />}
              </div>
            </>
          ) : (
            <p className="org-description">
              Your admin's policy and {o.org.protectedTerms.length} protected term{o.org.protectedTerms.length === 1 ? '' : 's'} now apply on this device.
            </p>
          )}
          <div className="create-join-actions">
            <button className="create-join-cancel" onClick={o.leave}>
              Leave this org on this device
            </button>
            <button className="create-join-cancel" onClick={() => void o.signOut()}>
              Sign out
            </button>
          </div>
        </div>
      )}
      {o.error && (
        <p className="org-description" role="alert">
          {o.error}
        </p>
      )}
    </div>
  );
}
