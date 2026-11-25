import { DocumentReference, Timestamp } from 'firebase/firestore';
import { Category, Action } from '@airlock/scrub-engine';

/**
 * Firestore data model types. BRIEF §9.2.
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
}

export interface StatsDoc {
  counts: Partial<Record<Category, number>>;
  requests: number;
  routes: { LOCAL_ANSWER: number; CLOUD_SCRUBBED: number; BLOCK: number };
}

export function getOrgRef(_orgId: string): DocumentReference<OrgDoc> {
  throw new Error('not implemented: architecture-skeleton');
}

export function getMemberRef(_orgId: string, _uid: string): DocumentReference<MemberDoc> {
  throw new Error('not implemented: architecture-skeleton');
}

export function getStatsRef(_orgId: string, _date: string): DocumentReference<StatsDoc> {
  throw new Error('not implemented: architecture-skeleton');
}
