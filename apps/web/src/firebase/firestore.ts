import { doc, getFirestore, type DocumentReference, type Firestore, type Timestamp } from 'firebase/firestore';
import type { Category, Action } from '@airlock/scrub-engine';
import { app } from './init';

/**
 * Firestore data model types. BRIEF §9.2. Org mode only; individuals use no Firestore.
 * Stats are counts only: never content, never per-message rows.
 */

export interface OrgDoc {
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  inviteCodeHash: string;
  policy: Partial<Record<Category, Action>>;
  protectedTerms: Array<{
    term: string;
    category: Category;
    action: Action;
  }>;
}

export interface MemberDoc {
  role: 'admin' | 'member';
  joinedAt: Timestamp;
  /** Hash of the invite code used to join; the rules compare it with the org's inviteCodeHash. */
  inviteCodeHash?: string;
}

export interface StatsDoc {
  counts: Partial<Record<Category, number>>;
  requests: number;
  routes: { LOCAL_ANSWER: number; CLOUD_SCRUBBED: number; BLOCK: number };
}

export function db(): Firestore {
  if (!app) throw new Error('Firebase is not configured');
  return getFirestore(app);
}

export function getOrgRef(orgId: string): DocumentReference<OrgDoc> {
  return doc(db(), 'orgs', orgId) as DocumentReference<OrgDoc>;
}

export function getMemberRef(orgId: string, uid: string): DocumentReference<MemberDoc> {
  return doc(db(), 'orgs', orgId, 'members', uid) as DocumentReference<MemberDoc>;
}

export function getStatsRef(orgId: string, date: string): DocumentReference<StatsDoc> {
  return doc(db(), 'orgs', orgId, 'stats', date) as DocumentReference<StatsDoc>;
}
