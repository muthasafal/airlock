import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { Action, Category, RouteDecision } from './org-types';
import { db, getMemberRef, getOrgRef, type OrgDoc, type StatsDoc } from '../firebase/firestore';
import { incrementStats, todayId } from './org-stats';

/**
 * Org mode (BRIEF §P1-1). Members pull the org policy and protected terms from Firestore and
 * apply them ON-DEVICE. Stats are counts-only increments. The invite code is never stored:
 * only its SHA-256 hash, which the security rules compare on join.
 */

export interface OrgContext {
  orgId: string;
  name: string;
  role: 'admin' | 'member';
  policy: Partial<Record<Category, Action>>;
  protectedTerms: OrgDoc['protectedTerms'];
}

const KEY = 'airlock-org-id';
let context: OrgContext | null = null;
const listeners = new Set<() => void>();
let unsubscribe: (() => void) | null = null;

const set = (c: OrgContext | null) => {
  context = c;
  listeners.forEach((l) => l());
};

export const getOrgContext = (): OrgContext | null => context;
export function onOrgChanged(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** SHA-256 hex of a normalised invite code (trimmed, upper case). */
export async function hashInviteCode(code: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code.trim().toUpperCase()));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** A readable 10-character invite code (no 0/O/1/I). */
export function newInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = crypto.getRandomValues(new Uint8Array(10));
  return [...r].map((b) => alphabet[b % alphabet.length]).join('');
}

/** Starts listening to the stored org for this user (policy and terms stay live). */
export async function loadOrg(uid: string): Promise<OrgContext | null> {
  const orgId = localStorage.getItem(KEY);
  if (!orgId) return null;
  try {
    const member = await getDoc(getMemberRef(orgId, uid));
    if (!member.exists()) {
      localStorage.removeItem(KEY);
      return null;
    }
    const role = member.data().role;
    unsubscribe?.();
    unsubscribe = onSnapshot(getOrgRef(orgId), (snap) => {
      const d = snap.data();
      if (d) set({ orgId, name: d.name, role, policy: d.policy ?? {}, protectedTerms: d.protectedTerms ?? [] });
    });
    return context;
  } catch {
    return null;
  }
}

/**
 * Creates an org and makes the creator its admin in ONE atomic batch (REVIEW item 1).
 * Returns the invite code to share; only its hash is stored.
 */
export async function createOrg(uid: string, name: string): Promise<{ orgId: string; inviteCode: string }> {
  const inviteCode = newInviteCode();
  const orgRef = doc(collection(db(), 'orgs'));
  const batch = writeBatch(db());
  batch.set(orgRef, {
    name: name.trim().slice(0, 80),
    createdBy: uid,
    createdAt: serverTimestamp(),
    inviteCodeHash: await hashInviteCode(inviteCode),
    policy: {},
    protectedTerms: [],
  });
  batch.set(doc(db(), 'orgs', orgRef.id, 'members', uid), { role: 'admin', joinedAt: serverTimestamp() });
  await batch.commit();
  localStorage.setItem(KEY, orgRef.id);
  await loadOrg(uid);
  return { orgId: orgRef.id, inviteCode };
}

/**
 * Joins an org with its id and invite code. The member doc carries the code's hash; the
 * security rules only allow the write when it matches the org's inviteCodeHash.
 */
export async function joinOrg(uid: string, orgId: string, inviteCode: string): Promise<void> {
  const batch = writeBatch(db());
  batch.set(doc(db(), 'orgs', orgId.trim(), 'members', uid), {
    role: 'member',
    joinedAt: serverTimestamp(),
    inviteCodeHash: await hashInviteCode(inviteCode),
  });
  await batch.commit();
  localStorage.setItem(KEY, orgId.trim());
  await loadOrg(uid);
}

export function leaveOrg(): void {
  unsubscribe?.();
  unsubscribe = null;
  localStorage.removeItem(KEY);
  set(null);
}

/** Admin: updates the category policy and protected terms (admin-entered, not user content). */
export async function saveOrgPolicy(policy: OrgContext['policy'], protectedTerms: OrgContext['protectedTerms']): Promise<void> {
  if (!context || context.role !== 'admin') throw new Error('Only an org admin can change the policy.');
  await updateDoc(getOrgRef(context.orgId), { policy, protectedTerms });
}

/** Admin: the last `days` daily stats docs (counts only). */
export async function loadOrgStats(days = 14): Promise<Array<{ date: string } & StatsDoc>> {
  if (!context) return [];
  const q = query(collection(db(), 'orgs', context.orgId, 'stats'), orderBy('__name__', 'desc'), limit(days));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ date: d.id, ...(d.data() as StatsDoc) })).reverse();
}

/** Member: adds today's counts (never content). No-op outside org mode. */
export async function recordOrgStats(counts: Partial<Record<Category, number>>, route: RouteDecision): Promise<void> {
  if (!context) return;
  await incrementStats(context.orgId, todayId(), counts, route);
}
