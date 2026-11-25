import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { User } from 'firebase/auth';
import { onUserChanged, signInWithGoogle, signOut } from '../../firebase/auth';
import { isFirebaseConfigured } from '../../firebase/init';
import {
  createOrg,
  getOrgContext,
  joinOrg,
  leaveOrg,
  loadOrg,
  loadOrgStats,
  onOrgChanged,
  saveOrgPolicy,
  type OrgContext,
} from '../../lib/org';

/** Org mode state and actions (BRIEF §P1-1). Logic lives in lib/org; this hook only binds it to React. */
export function useOrg() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const org = useSyncExternalStore(onOrgChanged, getOrgContext);

  useEffect(
    () =>
      onUserChanged((u) => {
        setUser(u);
        if (u) void loadOrg(u.uid);
      }),
    [],
  );

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setError('');
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        /permission|insufficient/i.test(msg)
          ? "That didn't work. Check the org ID and invite code with your admin."
          : msg,
      );
    }
  }, []);

  return {
    configured: isFirebaseConfigured,
    user,
    org,
    error,
    inviteCode,
    signIn: () => run(signInWithGoogle),
    signOut: () => run(async () => {
      leaveOrg();
      await signOut();
    }),
    create: (name: string) =>
      run(async () => {
        if (!user) throw new Error('Sign in first.');
        const r = await createOrg(user.uid, name);
        setInviteCode(r.inviteCode);
      }),
    join: (orgId: string, code: string) =>
      run(async () => {
        if (!user) throw new Error('Sign in first.');
        await joinOrg(user.uid, orgId, code);
      }),
    leave: leaveOrg,
    savePolicy: (policy: OrgContext['policy'], terms: OrgContext['protectedTerms']) => run(() => saveOrgPolicy(policy, terms)),
    loadStats: loadOrgStats,
  };
}
