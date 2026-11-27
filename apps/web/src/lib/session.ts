import {
  buildPolicy,
  countByCategory,
  createSessionMapping,
  createStreamingRestoreBuffer,
  detectRules,
  mergeFindings,
  restore,
  rulesDetector,
  scrub,
  type Category,
  type Detector,
  type Finding,
  type Policy,
  type SessionMapping,
} from '@airlock/scrub-engine';
import {
  answerOnDevice,
  checkAvailability,
  classifyTask,
  initializeDeviceModel,
  NanoDetector,
  withTimeout,
  type NanoAvailability,
  type TaskClassification,
} from '@airlock/nano-detector';
import { getNanoModels } from '../firebase/ai';
import { isFirebaseConfigured } from '../firebase/init';
import { getRemoteConfigValues, initRemoteConfig } from '../firebase/remoteConfig';
import { asScrubbed, sendScrubbed, type ScrubbedHistoryEntry } from './cloud-client';
import { saveReceipt, type InferenceSourceLabel, type ProtectionLevel, type Receipt } from './receipts';
import { decideRoute, type RouteDecision, type RouteOverride } from './router';
import { getSettings } from './settings';
import { createVault, purgeExpiredSessions, randomSeed } from './vault';
import { getOrgContext, recordOrgStats } from './org';

/**
 * The Airlock session service (framework-free; React hooks subscribe to it).
 * Owns the session mapping (kept encrypted in the vault), runs the full pipeline per message:
 * rules + Nano detection on-device, scrub, on-device task classification, the hybrid router,
 * then an on-device answer or a cloud answer on scrubbed text that is restored locally, and
 * finally a local receipt. Raw text and mappings never leave this module except to the
 * on-device model and the encrypted vault. BRIEF §3, §7 P0-1 to P0-8, §8.4.
 */

export type ChamberState = 'idle' | 'scrubbing' | 'sending' | 'local' | 'blocked' | 'restoring';

export interface ChatTurn {
  id: string;
  /** What the user wrote. In memory only; never stored or sent. */
  original: string;
  originalFindings: Finding[];
  /** What was (or would be) sent: stand-ins and ‹secret-N› placeholders. */
  scrubbed: string;
  /** The answer as shown: restored locally (cloud) or written on-device (local). */
  answer: string;
  /** The raw cloud answer with stand-ins, kept for the scrubbed multi-turn history. */
  answerScrubbed: string;
  restoredSpans: Array<{ start: number; end: number; standIn: string; original: string }>;
  route: RouteDecision | null;
  reason: string;
  status: 'scrubbing' | 'answering' | 'done' | 'blocked' | 'error';
  protectionLevel: ProtectionLevel;
  withheldSecrets: number;
  /** BLOCK because of a secret: the user may resend with the secret withheld. */
  canSendWithoutSecret: boolean;
  needsConsent: boolean;
  receipt: Receipt | null;
  error?: string;
}

export interface SessionState {
  ready: boolean;
  sessionId: string;
  availability: NanoAvailability;
  initProgress: number | null;
  /** Chrome says Nano is available, but it did not answer the warm-up: Chrome's model service is stuck. */
  nanoStalled: boolean;
  firebaseConfigured: boolean;
  consent: boolean;
  chamberState: ChamberState;
  busy: boolean;
  turns: ChatTurn[];
  protectionLevel: ProtectionLevel;
}

const vault = createVault();
const SESSION_KEY = 'airlock-session-id';

let mapping: SessionMapping = createSessionMapping(randomSeed());
let state: SessionState = {
  ready: false,
  sessionId: '',
  availability: 'unavailable',
  initProgress: null,
  nanoStalled: false,
  firebaseConfigured: isFirebaseConfigured,
  consent: false,
  chamberState: 'idle',
  busy: false,
  turns: [],
  protectionLevel: 'Reduced',
};

const listeners = new Set<() => void>();
function set(patch: Partial<SessionState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
function updateTurn(id: string, patch: Partial<ChatTurn>) {
  set({ turns: state.turns.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
}

export const sessionStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot: () => state,
};

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const ttlHours = () => getSettings().sessionTtlHours || getRemoteConfigValues().session_ttl_hours;
const nanoReady = () => state.availability === 'available' && !state.nanoStalled && getNanoModels() !== null;

let initPromise: Promise<void> | null = null;

/** Loads Remote Config, purges expired vault entries, restores (or starts) the session, checks Nano. */
export function initSession(): Promise<void> {
  initPromise ??= (async () => {
    await initRemoteConfig();
    try {
      await purgeExpiredSessions();
      let id = localStorage.getItem(SESSION_KEY);
      const loaded = id ? await vault.load(id) : null;
      if (!id || !loaded) {
        id = newId();
        localStorage.setItem(SESSION_KEY, id);
        mapping = createSessionMapping(randomSeed());
      } else {
        mapping = loaded;
      }
      set({ sessionId: id });
    } catch {
      // IndexedDB unavailable (private mode): keep an in-memory session.
      set({ sessionId: newId() });
    }
    await refreshAvailability();
    set({ ready: true });
  })();
  return initPromise;
}

export async function refreshAvailability(): Promise<NanoAvailability> {
  const availability = isFirebaseConfigured ? await checkAvailability() : 'unavailable';
  set({ availability, protectionLevel: availability === 'available' ? 'Full' : 'Reduced' });
  if (availability === 'available') void warmUp();
  return availability;
}

let warmed: Promise<void> | null = null;
/**
 * The first Gemini Nano call after Chrome loads the model is slow ("cold"). One tiny on-device
 * detection at startup (fictional text, never sent anywhere) keeps the first real message inside
 * the 8 s detection budget.
 */
function warmUp(): Promise<void> {
  warmed ??= (async () => {
    const models = getNanoModels();
    if (!models) return;
    const probe = new NanoDetector(models.detect, { timeoutMs: 60000 });
    try {
      await probe.detect('Hello from Maya at Northwind.', { nanoMinConfidence: 0.5 });
      set({ nanoStalled: probe.lastTimedOut, protectionLevel: probe.lastTimedOut ? 'Reduced' : 'Full' });
    } catch {
      set({ nanoStalled: true, protectionLevel: 'Reduced' });
    }
    if (state.nanoStalled) warmed = null;
  })();
  return warmed;
}

/** User gesture: triggers the Gemini Nano download through AI Logic with progress (BRIEF §P0-9). */
export async function enableOnDeviceModel(): Promise<void> {
  const models = getNanoModels();
  if (!models) return;
  set({ initProgress: 0 });
  try {
    await initializeDeviceModel(models.detect, (pct) => set({ initProgress: pct }));
  } finally {
    set({ initProgress: null });
    await refreshAvailability();
  }
}

export function setConsent(consent: boolean) {
  set({ consent });
}

/** Policy for this request: org policy > user settings > Remote Config > built-in (BRIEF §8.3). */
function currentPolicy(): Policy {
  const org = getOrgContext();
  return buildPolicy(
    { orgPolicy: org?.policy, userSettings: getSettings().categoryOverrides },
    org?.protectedTerms ?? [],
  );
}

function detectors(onProgress?: (pct: number) => void): { list: Detector[]; nano: NanoDetector | null } {
  const models = getNanoModels();
  const nano =
    nanoReady() && models
      ? new NanoDetector(models.detect, { chunkChars: getRemoteConfigValues().chunk_chars, timeoutMs: getSettings().nanoWaitSeconds * 1000, onProgress })
      : null;
  return { list: nano ? [rulesDetector, nano] : [rulesDetector], nano };
}

async function persistMapping() {
  if (!state.sessionId) return;
  try {
    await vault.store(state.sessionId, mapping, ttlHours());
  } catch {
    /* in-memory only */
  }
}

/** Live preview (rules only, instant): non-overlapping findings for highlighting. No mapping changes. */
export function previewFindings(text: string): Finding[] {
  const policy = currentPolicy();
  return mergeFindings(
    detectRules(text, { nanoMinConfidence: 0.5, protectedTerms: policy.protectedTerms }),
    { nanoMinConfidence: getRemoteConfigValues().nano_min_confidence },
  );
}

/** Live preview refinement with Nano (on-device), merged with the rules. */
/** Only one live-preview Nano call at a time, and none while a message is being sent. */
let previewInFlight = false;

export async function refinePreview(text: string): Promise<Finding[]> {
  if (previewInFlight || state.busy) return previewFindings(text);
  const { nano } = detectors();
  if (!nano || !text.trim()) return previewFindings(text);
  previewInFlight = true;
  try {
    const nanoFindings = await nano.detect(text, { nanoMinConfidence: getRemoteConfigValues().nano_min_confidence });
    const policy = currentPolicy();
    return mergeFindings(
      [...detectRules(text, { nanoMinConfidence: 0.5, protectedTerms: policy.protectedTerms }), ...nanoFindings],
      { nanoMinConfidence: getRemoteConfigValues().nano_min_confidence },
    );
  } catch {
    return previewFindings(text);
  } finally {
    previewInFlight = false;
  }
}

interface ScrubOutcome {
  text: string;
  findings: Finding[];
  counts: Partial<Record<Category, number>>;
  blocked: number;
  protection: ProtectionLevel;
  detectorsUsed: string[];
}

/** Scrubs with every available detector, updates the vault, reports the protection level. */
export async function scrubForSession(text: string): Promise<ScrubOutcome> {
  const { list, nano } = detectors();
  const result = await scrub(text, list, mapping, currentPolicy(), {
    nanoMinConfidence: getRemoteConfigValues().nano_min_confidence,
  });
  await persistMapping();
  const full = Boolean(nano) && !nano?.lastTimedOut && !result.failedDetectors;
  // Nano did not answer in time: stop waiting on it for the rest of this session, so the next
  // messages go straight to rule checks instead of hanging again. A reload tries Nano afresh.
  if (nano && (nano.lastTimedOut || result.failedDetectors)) set({ nanoStalled: true, protectionLevel: 'Reduced' });
  return {
    text: result.text,
    findings: result.findings,
    counts: countByCategory(result.findings),
    blocked: result.actions.filter((a) => a.action === 'BLOCK').length,
    protection: full ? 'Full' : 'Reduced',
    detectorsUsed: nano && !result.failedDetectors ? ['RULE', 'NANO'] : ['RULE'],
  };
}

/** Restores stand-ins in any text with this session's mapping (used by clipboard and receipts). */
export function restoreForSession(text: string) {
  return restore(text, mapping);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sends one chat message through the airlock (BRIEF §7 P0-6, §8.4).
 */
export async function submitMessage(text: string, override: RouteOverride = 'AUTO'): Promise<void> {
  if (!text.trim() || state.busy) return;
  await initSession();
  const id = newId();
  const turn: ChatTurn = {
    id,
    original: text,
    originalFindings: [],
    scrubbed: '',
    answer: '',
    answerScrubbed: '',
    restoredSpans: [],
    route: null,
    reason: '',
    status: 'scrubbing',
    protectionLevel: state.protectionLevel,
    withheldSecrets: 0,
    canSendWithoutSecret: false,
    needsConsent: false,
    receipt: null,
  };
  set({ busy: true, chamberState: 'scrubbing', turns: [...state.turns, turn] });

  try {
    // If the private model is still warming up, let it finish first (bounded by the wait setting).
    if (warmed && nanoReady()) {
      await Promise.race([warmed, sleep(3000)]);
    }
    const s = await scrubForSession(text);
    const rc = getRemoteConfigValues();
    const models = getNanoModels();
    let classification: TaskClassification | null = null;
    const sources: Record<string, InferenceSourceLabel> = { detection: 'ON_DEVICE' };
    if (nanoReady() && models && override === 'AUTO') {
      classification = await classifyTask(models.classify, s.text);
      sources.classification = 'ON_DEVICE';
    }
    // Nano exists but did not finish for this message: treat it like reduced protection, so
    // rules-only text never goes to the cloud without consent.
    const nanoFinished = nanoReady() && s.protection === 'Full';
    const decision = decideRoute({
      scrubbedLength: s.text.length,
      findings: s.findings,
      blockedCount: s.blocked,
      nanoAvailable: nanoFinished || (nanoReady() && override === 'LOCAL_ANSWER'),
      reducedBecause: nanoReady() && !nanoFinished ? "The private model didn't finish in time for this message" : undefined,
      consentGiven: state.consent,
      classification,
      userOverride: override,
      blockRequestOnSecret: rc.block_request_on_secret,
      localAnswerMaxChars: rc.local_answer_max_chars,
      cloudModel: getSettings().cloudModel === 'auto' ? rc.cloud_model : getSettings().cloudModel,
      cloudModelHard: getSettings().cloudModel === 'auto' ? rc.cloud_model_hard : getSettings().cloudModel,
    });
    updateTurn(id, {
      originalFindings: s.findings,
      scrubbed: s.text,
      route: decision.route,
      reason: decision.reason,
      protectionLevel: s.protection,
      withheldSecrets: s.blocked,
      canSendWithoutSecret: decision.route === 'BLOCK' && !decision.needsConsent && s.blocked > 0,
      needsConsent: Boolean(decision.needsConsent),
      status: decision.route === 'BLOCK' ? 'blocked' : 'answering',
    });

    let answerScrubbed = '';
    if (decision.route === 'BLOCK') {
      set({ chamberState: 'blocked' });
    } else if (decision.route === 'LOCAL_ANSWER' && models) {
      set({ chamberState: 'local' });
      let answer = '';
      const r = await withTimeout(
        answerOnDevice(models.answer, text, (chunk) => {
          answer += chunk;
          updateTurn(id, { answer });
        }),
        90000,
      ).catch((e) => {
        throw new Error(
          e instanceof Error && e.name === 'TimeoutError'
            ? 'The private model took too long to answer. Nothing was sent. Try again, or choose the cloud for this message.'
            : 'The private model could not answer this one. Nothing was sent. Try again, or choose the cloud for this message.',
        );
      });
      sources.answer = r.inferenceSource === 'in_cloud' ? 'IN_CLOUD' : 'ON_DEVICE';
      updateTurn(id, { answer: r.text });
    } else {
      set({ chamberState: 'sending' });
      const history: ScrubbedHistoryEntry[] = state.turns
        .filter((t) => t.id !== id && t.route === 'CLOUD_SCRUBBED' && t.status === 'done')
        .flatMap((t) => [
          { role: 'user' as const, content: asScrubbed(t.scrubbed) },
          { role: 'model' as const, content: asScrubbed(t.answerScrubbed) },
        ]);
      const buffer = createStreamingRestoreBuffer(mapping, 0);
      let shown = '';
      let first = true;
      for await (const chunk of sendScrubbed(asScrubbed(s.text), history, decision.model ?? rc.cloud_model)) {
        if (first) {
          set({ chamberState: 'restoring' });
          first = false;
        }
        if (chunk.inferenceSource) sources.answer = chunk.inferenceSource === 'on_device' ? 'ON_DEVICE' : 'IN_CLOUD';
        answerScrubbed += chunk.text;
        shown += buffer.push(chunk.text);
        updateTurn(id, { answer: shown });
      }
      shown += buffer.flush();
      sources.answer ??= 'IN_CLOUD';
      const restored = restore(answerScrubbed, mapping);
      updateTurn(id, { answer: restored.text, answerScrubbed, restoredSpans: restored.restoredSpans });
    }

    const receipt: Receipt = {
      id: newId(),
      timestamp: Date.now(),
      sessionId: state.sessionId,
      routeDecision: decision.route,
      routeReason: decision.reason,
      inferenceSource: sources,
      outboundPayload: decision.route === 'CLOUD_SCRUBBED' ? asScrubbed(s.text) : null,
      categoryCounts: s.counts,
      detectorsUsed: s.detectorsUsed,
      protectionLevel: s.protection,
      withheldSecrets: s.blocked,
      model: decision.route === 'CLOUD_SCRUBBED' ? decision.model : undefined,
    };
    await saveReceipt(receipt).catch(() => undefined);
    await recordOrgStats(s.counts, decision.route).catch(() => undefined);
    updateTurn(id, { receipt, status: decision.route === 'BLOCK' ? 'blocked' : 'done' });
    await sleep(decision.route === 'BLOCK' ? 1200 : 600);
  } catch (e) {
    updateTurn(id, {
      status: 'error',
      error: e instanceof Error ? e.message : 'Something went wrong. Nothing was sent.',
    });
  } finally {
    set({ busy: false, chamberState: 'idle' });
  }
}

/** Re-sends a blocked turn with the secret withheld (only ‹secret-N› placeholders go out). */
export async function sendWithoutSecret(turnId: string): Promise<void> {
  const t = state.turns.find((x) => x.id === turnId);
  if (!t) return;
  set({ turns: state.turns.filter((x) => x.id !== turnId) });
  await submitMessage(t.original, 'SEND_WITHOUT_SECRET');
}

/** "Forget this session": wipes the vault entry and starts a fresh mapping (BRIEF §P0-4). */
export async function forgetSession(): Promise<void> {
  try {
    if (state.sessionId) await vault.forget(state.sessionId);
  } catch {
    /* ignore */
  }
  mapping = createSessionMapping(randomSeed());
  const id = newId();
  localStorage.setItem(SESSION_KEY, id);
  set({ sessionId: id, turns: [], chamberState: 'idle' });
}

/** Deletes every vault entry (settings: delete local data). */
export async function forgetAllSessions(): Promise<void> {
  await vault.forgetAll();
  await forgetSession();
}

/** Copies text to the clipboard (Clipboard airlock, BRIEF §P0-8). */
export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Whether a protected-term policy or org is active (for UI copy only). */
export function hasOrgPolicy(): boolean {
  return getOrgContext() !== null;
}
