/**
 * Firestore security rules tests (BRIEF §9.2, §11.4; REVIEW item 1), run against the emulator:
 *   npm run test:rules
 * All ids and names are fictional.
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, increment, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

const HASH = 'a'.repeat(64); // sha256 of the invite code, as the client sends it
const WRONG = 'b'.repeat(64);
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'airlock-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(async () => env?.cleanup());
beforeEach(async () => env.clearFirestore());

const as = (uid: string) => env.authenticatedContext(uid).firestore();

/** Seeds an org "o1" with admin "alice" and member "bob" (bypassing rules). */
async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'orgs/o1'), { name: 'Northwind Labs', createdBy: 'alice', inviteCodeHash: HASH, policy: {}, protectedTerms: [] });
    await setDoc(doc(db, 'orgs/o1/members/alice'), { role: 'admin' });
    await setDoc(doc(db, 'orgs/o1/members/bob'), { role: 'member', inviteCodeHash: HASH });
    await setDoc(doc(db, 'orgs/o1/stats/2026-11-26'), { counts: { PERSON: 3 }, requests: 2, routes: { CLOUD_SCRUBBED: 2 } });
  });
}

describe('creating an org', () => {
  const org = (createdBy: string) => ({
    name: 'Northwind Labs', createdBy, createdAt: serverTimestamp(), inviteCodeHash: HASH, policy: {}, protectedTerms: [],
  });

  it('allows the org and the creator as admin in one batch', async () => {
    const db = as('alice');
    const b = writeBatch(db);
    b.set(doc(db, 'orgs/n1'), org('alice'));
    b.set(doc(db, 'orgs/n1/members/alice'), { role: 'admin', joinedAt: serverTimestamp() });
    await assertSucceeds(b.commit());
  });

  it('denies the org without the admin membership in the same batch', async () => {
    await assertFails(setDoc(doc(as('alice'), 'orgs/n1'), org('alice')));
  });

  it('denies creating an org on behalf of someone else', async () => {
    const db = as('mallory');
    const b = writeBatch(db);
    b.set(doc(db, 'orgs/n1'), org('alice'));
    b.set(doc(db, 'orgs/n1/members/mallory'), { role: 'admin', joinedAt: serverTimestamp() });
    await assertFails(b.commit());
  });
});

describe('joining an org', () => {
  beforeEach(seed);

  it('allows joining as a member with the right invite code hash', async () => {
    await assertSucceeds(setDoc(doc(as('carol'), 'orgs/o1/members/carol'), { role: 'member', joinedAt: serverTimestamp(), inviteCodeHash: HASH }));
  });

  it('denies joining with a wrong code or no code', async () => {
    await assertFails(setDoc(doc(as('carol'), 'orgs/o1/members/carol'), { role: 'member', joinedAt: serverTimestamp(), inviteCodeHash: WRONG }));
    await assertFails(setDoc(doc(as('carol'), 'orgs/o1/members/carol'), { role: 'member', joinedAt: serverTimestamp() }));
  });

  it('denies making yourself an admin of an existing org', async () => {
    await assertFails(setDoc(doc(as('carol'), 'orgs/o1/members/carol'), { role: 'admin', joinedAt: serverTimestamp() }));
  });

  it('denies adding someone else', async () => {
    await assertFails(setDoc(doc(as('carol'), 'orgs/o1/members/dave'), { role: 'member', joinedAt: serverTimestamp(), inviteCodeHash: HASH }));
  });
});

describe('policy', () => {
  beforeEach(seed);

  it('lets members read their org and strangers not', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), 'orgs/o1')));
    await assertFails(getDoc(doc(as('eve'), 'orgs/o1')));
  });

  it('lets admins update the policy and terms only', async () => {
    await assertSucceeds(updateDoc(doc(as('alice'), 'orgs/o1'), { policy: { PERSON: 'BLOCK' }, protectedTerms: [{ term: 'Project Falcon', category: 'ORG_TERM', action: 'PSEUDONYMIZE' }] }));
    await assertFails(updateDoc(doc(as('alice'), 'orgs/o1'), { inviteCodeHash: WRONG }));
  });

  it('denies members changing the policy', async () => {
    await assertFails(updateDoc(doc(as('bob'), 'orgs/o1'), { policy: { PERSON: 'KEEP' } }));
  });
});

describe('stats: counts only', () => {
  beforeEach(seed);
  const stats = (db: ReturnType<typeof as>, date = '2026-11-26') => doc(db, `orgs/o1/stats/${date}`);

  it('allows the first write of a new day (create, REVIEW item 1)', async () => {
    await assertSucceeds(setDoc(stats(as('bob'), '2026-11-27'), { counts: { EMAIL: increment(2) }, requests: increment(1), routes: { BLOCK: increment(1) } }, { merge: true }));
  });

  it('allows members to increment known numeric fields', async () => {
    await assertSucceeds(setDoc(stats(as('bob')), { counts: { PERSON: increment(1), API_KEY: increment(1) }, requests: increment(1), routes: { LOCAL_ANSWER: increment(1) } }, { merge: true }));
  });

  it('denies decrements', async () => {
    await assertFails(setDoc(stats(as('bob')), { counts: { PERSON: 1 } }, { merge: true }));
    await assertFails(setDoc(stats(as('bob')), { requests: 0 }, { merge: true }));
  });

  it('denies content: strings, unknown categories and new fields', async () => {
    await assertFails(setDoc(stats(as('bob')), { counts: { PERSON: 'Priya Shah' } }, { merge: true }));
    await assertFails(setDoc(stats(as('bob')), { counts: { SECRET_NOTE: 1 } }, { merge: true }));
    await assertFails(setDoc(stats(as('bob')), { message: 'the raw prompt' }, { merge: true }));
    await assertFails(setDoc(stats(as('bob'), 'not-a-date'), { requests: 1 }));
  });

  it('denies non-members and lets only admins read', async () => {
    await assertFails(setDoc(stats(as('eve')), { requests: increment(1) }, { merge: true }));
    await assertFails(getDoc(stats(as('bob'))));
    await assertSucceeds(getDoc(stats(as('alice'))));
  });
});
