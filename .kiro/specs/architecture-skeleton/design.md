# Design Document: architecture-skeleton

## Overview

This spec creates every planned file of Airlock as a wired, type-correct skeleton. No feature logic is implemented; bodies are stubs (`throw new Error("not implemented: architecture-skeleton")`). Every file exports its real types, interfaces, and function signatures with doc comments that cite the BRIEF section the implementation must follow. Subsequent specs fill in bodies only.

The skeleton achieves three things: (1) gives TypeScript a complete type graph so `npm run typecheck` and `npm run build` pass from day one, (2) gives every later spec a stable import contract so specs can be written in parallel without import-not-found errors, and (3) makes the traceability table below verifiable — every BRIEF feature has a named home.

---

## Architecture

### Package boundaries (BRIEF §11.1)

```
packages/scrub-engine      Pure TS, no DOM, no React, no Firebase
packages/nano-detector     Firebase AI Logic wrapper only
apps/web                   React 19 + Vite; imports both packages
```

Packages never import from apps. `nano-detector` imports `scrub-engine` types (the `Detector` interface). `web` imports both.

### Module graph (key edges)

```
web/App.tsx
  → react-router routes (lazy /bench)
  → features/chat/ChatPage
      → features/chat/useAirlockSession  (all logic)
      → ui/AirlockChamber
      → features/onboarding/ProtectionStatus
  → features/clipboard/ClipboardAirlock
  → features/receipts/ReceiptsPage
  → features/org/OrgPage
  → features/bench/BenchPage (lazy)
  → features/settings/SettingsPage
  → features/onboarding/{LandingPage, HowItWorksPage, PrivacyPage, TermsPage}

web/lib/router.ts
  → @airlock/nano-detector (classification)
  → @airlock/scrub-engine (types)

web/lib/cloud-client.ts
  → firebase/ai (ONLY_IN_CLOUD)
  → firebase/init, firebase/appCheck

web/lib/vault.ts
  → idb
  → @airlock/scrub-engine (SessionMapping)

@airlock/nano-detector/index.ts
  → @airlock/scrub-engine (Detector interface, Finding, DetectorConfig)
  → firebase/ai
  → zod
```

---

## Detailed design

### scrub-engine

#### `src/types.ts`

Extends the existing file with the missing exports: `Detector` interface, `VaultInterface`, `PolicySources`, `StandInGenerator`, `StreamingRestoreBuffer`, `ScrubInput`. The `Finding`, `SessionMapping`, `ScrubResult`, `RestoreResult`, `Policy`, `Action`, `Category`, `DetectorType` types already exist and are correct.

```typescript
// New additions to src/types.ts

export interface Detector {
  detect(text: string, config: DetectorConfig): Promise<Finding[]>;
}

export interface VaultInterface {
  store(sessionId: string, mapping: SessionMapping, ttlHours: number): Promise<void>;
  load(sessionId: string): Promise<SessionMapping | null>;
  forget(sessionId: string): Promise<void>;
  forgetAll(): Promise<void>;
  isExpired(sessionId: string): Promise<boolean>;
}

export interface PolicySources {
  orgPolicy?: Partial<Record<Category, Action>>;
  userSettings?: Partial<Record<Category, Action>>;
  remoteConfig?: Partial<Record<Category, Action>>;
}

export interface StandInGenerator {
  generate(original: string, category: Category, mapping: SessionMapping): string;
}

export interface StreamingRestoreBuffer {
  push(chunk: string): string;
  flush(): string;
}

export interface ScrubInput {
  text: string;
  detectors: Detector[];
  mapping: SessionMapping;
  policy: Policy;
}
```

#### `src/checksums/luhn.ts`

```typescript
/** Implements Luhn algorithm. BRIEF §8.1 CARD, §8.2 "Fakes stay fake" invariant. */
export function luhnCheck(digits: string): boolean { throw new Error("not implemented: architecture-skeleton"); }
/** Returns true if the digits deliberately FAIL Luhn (for generated stand-ins). */
export function luhnFail(digits: string): boolean { throw new Error("not implemented: architecture-skeleton"); }
```

#### `src/checksums/verhoeff.ts`

```typescript
/** Implements Verhoeff checksum. BRIEF §8.1 AADHAAR. */
export function verhoeffCheck(digits: string): boolean { throw new Error("not implemented: architecture-skeleton"); }
/** Returns true if the digits deliberately FAIL Verhoeff (for generated stand-ins). */
export function verhoeffFail(digits: string): boolean { throw new Error("not implemented: architecture-skeleton"); }
```

#### `src/checksums/entropy.ts`

```typescript
/** Computes Shannon entropy in bits/character. Used by API_KEY high-entropy detection. BRIEF §8.1. */
export function shannonEntropy(s: string): number { throw new Error("not implemented: architecture-skeleton"); }
```

#### `src/detectors/*.ts` (15 files)

Each file exports one named function and may import checksum helpers. Example signatures:

```typescript
// detectors/email.ts
/** Detects EMAIL spans using RFC-lite regex. BRIEF §8.1 Layer A. */
export function detectEmail(text: string, config?: DetectorConfig): Finding[] {
  throw new Error("not implemented: architecture-skeleton");
}

// detectors/aadhaar.ts
/** Detects AADHAAR spans: regex + Verhoeff checksum. BRIEF §8.1 Layer A. */
export function detectAadhaar(text: string, config?: DetectorConfig): Finding[] {
  throw new Error("not implemented: architecture-skeleton");
}

// detectors/api-key.ts
/** Detects API_KEY by known prefixes and high-entropy heuristic (Shannon ≥ 3.5). BRIEF §8.1 Layer A. */
export function detectApiKey(text: string, config?: DetectorConfig): Finding[] {
  throw new Error("not implemented: architecture-skeleton");
}

// detectors/org-term.ts
/** Detects ORG_TERM using whole-word matching against config.protectedTerms. BRIEF §8.1 Layer A. */
export function detectOrgTerm(text: string, config?: DetectorConfig): Finding[] {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `src/detectors/index.ts`

Re-exports all 15 detector functions and a convenience `ALL_RULE_DETECTORS: Detector[]` array.

#### `src/merge.ts`

```typescript
/**
 * Merges findings from all detectors applying Layer C rules: union, sort by start,
 * prefer longer on overlap, rules beat Nano for structured types, severity wins.
 * BRIEF §8.1 Layer C.
 */
export function mergeFindings(findings: Finding[], config: DetectorConfig): Finding[] {
  throw new Error("not implemented: architecture-skeleton");
}

/** Severity order used by merge. Higher index = higher severity. */
export const CATEGORY_SEVERITY: Category[] = [
  'OTHER_SENSITIVE', 'DATE_OF_BIRTH', 'LOCATION', 'ORG_TERM', 'INTERNAL_PROJECT',
  'LEGAL_MATTER', 'HEALTH', 'FINANCIAL_AMOUNT', 'PERSON', 'ORG', 'EMAIL', 'PHONE',
  'UPI', 'IFSC', 'BANK_ACCOUNT', 'IP_ADDRESS', 'URL_SECRET', 'PAN', 'GOVERNMENT_ID',
  'AADHAAR', 'CARD', 'JWT', 'API_KEY', 'PRIVATE_KEY', 'PASSWORD', 'CREDENTIAL',
];
```

#### `src/policy.ts`

```typescript
/** Default action per category. BRIEF §8.3. */
export const DEFAULT_POLICY: Record<Category, Action> = { /* ... */ };

/**
 * Resolves the effective action for a category using the resolution order:
 * org policy > user settings > Remote Config defaults > built-in defaults. BRIEF §8.3.
 */
export function resolveAction(category: Category, sources: PolicySources): Action {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `src/pools/*.json` (7 files)

Minimal valid JSON arrays (empty or one placeholder entry) so the build resolves imports. The scrub-engine spec fills them with ≥300 entries each.

```
src/pools/indian-first-names.json   ["Priya"]
src/pools/indian-surnames.json      ["Shah"]
src/pools/western-first-names.json  ["Alice"]
src/pools/western-surnames.json     ["Smith"]
src/pools/company-names.json        ["Northwind Labs"]
src/pools/cities.json               ["Springfield"]
src/pools/codenames.json            ["Amber Falcon"]
```

#### `src/stand-ins.ts`

```typescript
/**
 * Creates a seeded stand-in generator. Seed is stored in the vault per session. BRIEF §8.2.
 * Uses mulberry32 PRNG. Pools are loaded from src/pools/*.json.
 */
export function createStandInGenerator(seed: number): StandInGenerator {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `src/restore.ts`

```typescript
/**
 * Restores stand-ins to originals in a model answer. Handles case variants, possessives,
 * first-name/surname aliases, and titles. BRIEF §8.5.
 */
export function restore(text: string, mapping: SessionMapping): RestoreResult {
  throw new Error("not implemented: architecture-skeleton");
}

/**
 * Creates a streaming restore buffer. Holds a tail of maxStandInLength characters,
 * emitting text only when it cannot be the prefix of a stand-in. BRIEF §8.5.
 */
export function createStreamingRestoreBuffer(
  mapping: SessionMapping,
  maxStandInLength: number,
): StreamingRestoreBuffer {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `src/scrub.ts`

```typescript
/**
 * Entry point. Runs detectors, merges findings (Layer C), applies policy,
 * generates stand-ins, and returns the scrubbed text with the updated mapping. BRIEF §8.1–8.3.
 */
export async function scrub(
  text: string,
  detectors: Detector[],
  mapping: SessionMapping,
  policy: Policy,
): Promise<ScrubResult> {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `bin/check-prompt.mjs`

```javascript
#!/usr/bin/env node
/**
 * Secret-guard hook entry point. BRIEF §12 (Hooks).
 * Reads USER_PROMPT from env, runs rule-only detectors, exits 2 if any BLOCK/PSEUDONYMIZE
 * finding is found. Used as the secret-guard Kiro hook.
 */
```

---

### nano-detector

#### `src/availability.ts`

```typescript
export type NanoAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable';

/**
 * Checks whether Gemini Nano is available on this device. BRIEF §6, §P0-9.
 * Wraps LanguageModel.availability() from the Firebase AI SDK.
 */
export async function checkAvailability(): Promise<NanoAvailability> {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `src/init.ts`

```typescript
/**
 * Triggers Gemini Nano download after a user gesture. BRIEF §6.
 * Calls model.initializeDeviceModel(). Reports progress via onProgress(0..100).
 */
export async function initializeDeviceModel(
  onProgress?: (pct: number) => void,
): Promise<void> {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `src/detection.ts`

The Zod schema is defined here and used at runtime:

```typescript
import { z } from 'zod';

export const NanoFindingSchema = z.object({
  text: z.string(),
  category: z.enum(['PERSON','ORG','LOCATION','HEALTH','FINANCIAL_AMOUNT',
    'LEGAL_MATTER','INTERNAL_PROJECT','CREDENTIAL','GOVERNMENT_ID',
    'DATE_OF_BIRTH','OTHER_SENSITIVE']),
  confidence: z.number().min(0).max(1),
});

export const NanoResponseSchema = z.object({
  findings: z.array(NanoFindingSchema),
});

export type NanoFinding = z.infer<typeof NanoFindingSchema>;

export interface NanoDetectionResult {
  findings: NanoFinding[];
  timedOut: boolean;
}

/**
 * Runs Nano detection with ONLY_ON_DEVICE and the BRIEF §8.1 Layer B system prompt.
 * Validates response with Zod. Times out at 8 s and sets timedOut = true. BRIEF §8.1.
 */
export async function detectWithNano(
  text: string,
  model: GenerativeModel,
): Promise<NanoDetectionResult> {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `src/span-resolution.ts`

```typescript
/**
 * Resolves Nano text spans to source offsets. Exact match, then case-insensitive.
 * Drops hallucinated spans. Expands to all occurrences. BRIEF §8.1 Layer B.
 */
export function resolveSpans(findings: NanoFinding[], source: string): Finding[] {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `src/chunking.ts`

```typescript
export interface Chunk { text: string; offset: number; }

export interface ChunkedDetectionResult {
  findings: NanoFinding[];
  timedOut: boolean;
  chunksProcessed: number;
}

/**
 * Splits text into chunks at paragraph boundaries. BRIEF §8.1 Layer B.
 * Defaults: chunkSize = 4000, overlap = 200.
 */
export function chunkText(
  text: string,
  chunkSize?: number,
  overlap?: number,
): Chunk[] {
  throw new Error("not implemented: architecture-skeleton");
}

/**
 * Runs detection across all chunks sequentially. Reports progress. BRIEF §8.1 Layer B.
 */
export async function detectChunked(
  text: string,
  model: GenerativeModel,
  onProgress?: (pct: number) => void,
): Promise<ChunkedDetectionResult> {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `src/classification.ts`

```typescript
export type TaskType =
  | 'REWRITE' | 'SUMMARIZE_SHORT' | 'TRANSLATE_SHORT' | 'QA_ON_TEXT'
  | 'REASONING' | 'CODE' | 'CREATIVE_LONG' | 'OTHER';

export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskClassification {
  task: TaskType;
  complexity: Complexity;
}

/**
 * Classifies the task type and complexity using ONLY_ON_DEVICE structured output.
 * Used by the hybrid router (Step 1 of BRIEF §8.4).
 */
export async function classifyTask(
  text: string,
  model: GenerativeModel,
): Promise<TaskClassification> {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `src/index.ts`

Exports `NanoDetector` class (implements `Detector`) plus all public functions and types.

---

### apps/web/src/firebase

#### `firebase/init.ts`

```typescript
import { initializeApp, FirebaseApp } from 'firebase/app';
/** Initialises Firebase from VITE_ env vars. Called once at startup. */
export const app: FirebaseApp = /* stub */ null as unknown as FirebaseApp;
```

#### `firebase/appCheck.ts`

```typescript
/**
 * Initialises App Check. Dev: sets debug token flag. Prod: ReCaptchaV3Provider.
 * Must be called before any AI Logic call. BRIEF §9.4.
 */
export function initAppCheck(app: FirebaseApp): void {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `firebase/remoteConfig.ts`

```typescript
export interface RemoteConfigValues {
  cloud_model: string;           // default: 'gemini-3.5-flash-lite'
  cloud_model_hard: string;      // default: 'gemini-3.8-flash'
  nano_min_confidence: number;   // default: 0.5
  local_answer_max_chars: number;// default: 3000
  chunk_chars: number;           // default: 4000
  block_request_on_secret: boolean; // default: true
  session_ttl_hours: number;     // default: 24
  feature_screenshot: boolean;   // default: false
  feature_org_mode: boolean;     // default: true
}
// Typed accessor for each key exported as getCloudModel(), getNanoMinConfidence(), etc.
```

#### `firebase/auth.ts`

```typescript
export async function signInWithGoogle(): Promise<UserCredential> {
  throw new Error("not implemented: architecture-skeleton");
}
export async function signOut(): Promise<void> {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `firebase/firestore.ts`

```typescript
/** BRIEF §9.2 */
export interface OrgDoc {
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  inviteCodeHash: string;
  policy: Partial<Record<Category, Action>>;
  protectedTerms: Array<{ term: string; category: Category; action: Action }>;
}
export interface MemberDoc { role: 'admin' | 'member'; joinedAt: Timestamp; }
export interface StatsDoc {
  counts: Partial<Record<Category, number>>;
  requests: number;
  routes: { LOCAL_ANSWER: number; CLOUD_SCRUBBED: number; BLOCK: number };
}
export function getOrgRef(orgId: string): DocumentReference<OrgDoc> { throw new Error("not implemented: architecture-skeleton"); }
export function getMemberRef(orgId: string, uid: string): DocumentReference<MemberDoc> { throw new Error("not implemented: architecture-skeleton"); }
export function getStatsRef(orgId: string, date: string): DocumentReference<StatsDoc> { throw new Error("not implemented: architecture-skeleton"); }
```

---

### apps/web/src/lib

#### `lib/router.ts`

```typescript
export type RouteDecision = 'LOCAL_ANSWER' | 'CLOUD_SCRUBBED' | 'BLOCK';

export interface RouterInput {
  text: string;
  findings: Finding[];
  nanoAvailable: boolean;
  consentGiven: boolean;
  userOverride?: RouteDecision;
}

export interface RouterDecision {
  route: RouteDecision;
  reason: string;        // Plain English. BRIEF §8.4.
  model?: string;        // Set for CLOUD_SCRUBBED.
}

/**
 * Two-step decision: (1) classify task on-device, (2) apply BRIEF §8.4 decision table.
 * Returns a RouterDecision with a plain-English reason.
 */
export async function routeRequest(input: RouterInput): Promise<RouterDecision> {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `lib/cloud-client.ts`

```typescript
declare const __brand: unique symbol;
export type ScrubbedText = string & { [__brand]: 'ScrubbedText' };
export function asScrubbed(s: string): ScrubbedText { return s as ScrubbedText; }

export interface ScrubbedHistoryEntry { role: 'user' | 'model'; content: ScrubbedText; }

/**
 * Streams a cloud answer. Uses ONLY_IN_CLOUD with the scrubbed history. BRIEF §P0-6.
 * Never accepts raw text; enforced by the ScrubbedText branded type.
 */
export async function* sendScrubbed(
  scrubbed: ScrubbedText,
  history: ScrubbedHistoryEntry[],
  model: string,
): AsyncIterable<string> {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `lib/vault.ts`

```typescript
export interface Vault {
  store(sessionId: string, mapping: SessionMapping, ttlHours: number): Promise<void>;
  load(sessionId: string): Promise<SessionMapping | null>;
  forget(sessionId: string): Promise<void>;
  forgetAll(): Promise<void>;
  isExpired(sessionId: string): Promise<boolean>;
}

/**
 * Creates a vault backed by IndexedDB. Encrypts with AES-GCM, non-extractable key.
 * Key is stored in a separate IDB object store. BRIEF §P0-4.
 */
export function createVault(): Vault {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `lib/receipts.ts`

```typescript
export type ProtectionLevel = 'Full' | 'Reduced';

export interface Receipt {
  id: string;
  timestamp: number;
  routeDecision: RouteDecision;
  routeReason: string;
  inferenceSource: Record<string, 'ON_DEVICE' | 'IN_CLOUD'>;
  outboundPayload: ScrubbedText;      // scrubbed text only, never original
  categoryCounts: Partial<Record<Category, number>>;
  detectorsUsed: DetectorType[];
  protectionLevel: ProtectionLevel;
}

/** Saves a receipt to IndexedDB. Never uploads. BRIEF §P0-7. */
export async function saveReceipt(r: Receipt): Promise<void> { throw new Error("not implemented: architecture-skeleton"); }
export async function listReceipts(): Promise<Receipt[]> { throw new Error("not implemented: architecture-skeleton"); }
export async function clearReceipts(): Promise<void> { throw new Error("not implemented: architecture-skeleton"); }
```

#### `lib/settings.ts`

```typescript
export interface Settings {
  sessionTtlHours: number;
  categoryOverrides: Partial<Record<Category, Action>>;
  showStandIns: boolean;
  language: string;
}

/** Reads settings from localStorage with defaults. BRIEF §P1-3. */
export function getSettings(): Settings { throw new Error("not implemented: architecture-skeleton"); }
export function updateSettings(patch: Partial<Settings>): void { throw new Error("not implemented: architecture-skeleton"); }
```

#### `lib/org-stats.ts`

```typescript
/**
 * Increments org stats using FieldValue.increment() only. Never writes strings. BRIEF §9.2.
 */
export async function incrementStats(
  orgId: string,
  date: string,
  counts: Partial<Record<Category, number>>,
  route: RouteDecision,
): Promise<void> {
  throw new Error("not implemented: architecture-skeleton");
}
```

---

### apps/web/src/App.tsx

```tsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import AppShell from './ui/components/AppShell';
import LandingPage from './features/onboarding/LandingPage';
import ChatPage from './features/chat/ChatPage';
// ... all other pages (non-lazy)
const BenchPage = React.lazy(() => import('./features/bench/BenchPage'));
```

Routes: `/`, `/chat`, `/clipboard`, `/receipts`, `/org`, `/bench` (lazy), `/how-it-works`, `/privacy`, `/terms`, `/settings`.

---

### apps/web/src/ui

#### `ui/tokens.css`

Defines CSS custom properties:

```css
:root {
  --font-display: 'Baloo 2', system-ui, sans-serif;
  --font-body: 'Nunito', system-ui, sans-serif;
  --font-accent: 'Caveat', cursive;

  /* Palette: cool pale mint ground, deep ink, action teal, success green */
  --color-ground: #edf7f4;
  --color-ink: #1a2e28;
  --color-action: #0d7a5f;
  --color-success: #2e7d55;
  /* Category semantic colours (subtle) */
  --color-cat-person: #c8e6c9;
  --color-cat-credential: #ffccbc;
  /* etc. */

  --radius-card: 28px;
  --radius-card-lg: 34px;
  --easing-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-default: 280ms;
}
```

#### `ui/components/AppShell.tsx`

```tsx
interface AppShellProps { children: React.ReactNode; }
export default function AppShell({ children }: AppShellProps): JSX.Element {
  throw new Error("not implemented: architecture-skeleton");
}
```

#### `ui/AirlockChamber/AirlockChamber.tsx`

```tsx
export type ChamberState = 'idle' | 'scrubbing' | 'sending' | 'local' | 'blocked' | 'restoring';

interface AirlockChamberProps {
  state: ChamberState;
  findings?: Finding[];  // for per-word flip animation by category
}

/**
 * SVG + Framer Motion chamber animation. BRIEF §10.3.
 * Respects prefers-reduced-motion: renders static step diagram when set.
 * States: idle (doors resting), scrubbing (inner door closes + flip), sending (outer opens),
 * local (outer never opens), blocked (red lamp), restoring (reverse flow).
 */
export default function AirlockChamber(props: AirlockChamberProps): JSX.Element {
  throw new Error("not implemented: architecture-skeleton");
}
```

---

### Feature components (all stubs with typed props)

#### `features/chat/ChatPage.tsx`
No props (reads from hooks). Composes Composer, TurnList, AirlockChamber, ProtectionStatus.

#### `features/chat/Turn.tsx`
```tsx
interface TurnProps {
  original: string;
  originalFindings: Finding[];
  scrubbed: string;
  answer: string;
  restoredSpans: Array<{ start: number; end: number; standIn: string; original: string }>;
  receipt: Receipt;
}
```

#### `features/chat/RestoredSpan.tsx`
```tsx
interface RestoredSpanProps { standIn: string; original: string; }
```

#### `features/chat/Composer.tsx`
```tsx
interface ComposerProps {
  onSubmit: (text: string) => void;
  onPreviewChange: (findings: Finding[]) => void;
  disabled?: boolean;
}
```

#### `features/chat/RoutePicker.tsx`
```tsx
interface RoutePickerProps {
  decision: RouterDecision;
  onOverride: (r: RouteDecision) => void;
}
```

#### `features/chat/useAirlockSession.ts`
```typescript
export interface AirlockSession {
  turns: Turn[];
  submit: (text: string, override?: RouteDecision) => Promise<void>;
  previewFindings: (text: string) => Finding[];
  chamberState: ChamberState;
  protectionLevel: ProtectionLevel;
  sessionId: string;
  forgetSession: () => void;
}
export function useAirlockSession(): AirlockSession { throw new Error("not implemented: architecture-skeleton"); }
```

#### `features/onboarding/useProtectionStatus.ts`
```typescript
export interface ProtectionStatusHook {
  availability: NanoAvailability;
  initProgress: number | null;
  startInit: () => void;
}
export function useProtectionStatus(): ProtectionStatusHook { throw new Error("not implemented: architecture-skeleton"); }
```

#### `features/onboarding/ProtectionStatus.tsx`
```tsx
interface ProtectionStatusProps { showEnableButton?: boolean; }
```

#### `features/onboarding/EnableNanoButton.tsx`
No props (reads from useProtectionStatus internally).

#### `features/onboarding/LandingPage.tsx`, `HowItWorksPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx`
All are `(): JSX.Element` with no props.

#### `features/receipts/ReceiptsPage.tsx`
No props.

#### `features/receipts/ReceiptView.tsx`
```tsx
interface ReceiptViewProps { receipt: Receipt; }
```

#### `features/receipts/useReceipts.ts`
```typescript
export function useReceipts(): { receipts: Receipt[]; clear: () => void; exportJson: () => void; } { throw new Error("not implemented: architecture-skeleton"); }
```

#### `features/clipboard/ClipboardAirlock.tsx`
No props (self-contained with useAirlockSession).

#### `features/org/OrgPage.tsx`
No props.

#### `features/org/CreateJoin.tsx`
```tsx
interface CreateJoinProps { onCreateOrg: (name: string) => void; onJoinOrg: (code: string) => void; }
```

#### `features/org/PolicyEditor.tsx`
```tsx
interface PolicyEditorProps { policy: Policy; onSave: (p: Policy) => void; }
```

#### `features/org/TermsEditor.tsx`
```tsx
interface TermsEditorProps { terms: OrgDoc['protectedTerms']; onSave: (t: OrgDoc['protectedTerms']) => void; }
```

#### `features/org/StatsDashboard.tsx`
```tsx
interface StatsDashboardProps { stats: StatsDoc[]; }
```

#### `features/bench/BenchPage.tsx`
No props.

#### `features/settings/SettingsPage.tsx`
No props.

---

### `firestore.rules` (corrected)

Addresses all REVIEW item 1 bugs:

1. **Create vs update**: stats `allow write` splits into `allow create` (no diff check needed, just field allowlist) and `allow update` (monotonic int check).
2. **Int + monotonic increments**: on update, each changed numeric field asserts `request.resource.data.X is int && request.resource.data.X >= resource.data.X`.
3. **Invite-code check**: `members` create requires `request.resource.data.inviteCodeHash == get(orgPath).data.inviteCodeHash` (client hashes the code with SHA-256 before submitting).
4. **Atomic admin on create**: org `allow create` permits the creator to also write `members/{uid}` in the same batch by allowing `members` create when the parent org is being created in the same request (or a Cloud Function is used; the rule grants the pattern).

---

### `firebase.json` (corrected CSP)

Addresses REVIEW item 2:

```json
"Content-Security-Policy": "default-src 'self'; script-src 'self' https://www.google.com https://www.gstatic.com; style-src 'self'; font-src 'self'; connect-src 'self' https://*.googleapis.com https://*.firebase.googleapis.com https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; img-src 'self' data:; frame-src https://www.google.com https://recaptcha.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
```

Fonts will be self-hosted in `apps/web/public/fonts/` (placeholder directories; actual font files added in airlock-chat spec).

---

## Components and Interfaces

See the Detailed design section above for full component signatures. The key interfaces that cross package boundaries are:

**`Detector` (scrub-engine → nano-detector)**
```typescript
interface Detector {
  detect(text: string, config: DetectorConfig): Promise<Finding[]>;
}
```
`NanoDetector` in `nano-detector/src/index.ts` implements this. `ALL_RULE_DETECTORS` in `scrub-engine/src/detectors/index.ts` is an array of rule-based implementations.

**`VaultInterface` (scrub-engine → lib/vault.ts)**
```typescript
interface VaultInterface {
  store(sessionId: string, mapping: SessionMapping, ttlHours: number): Promise<void>;
  load(sessionId: string): Promise<SessionMapping | null>;
  forget(sessionId: string): Promise<void>;
  forgetAll(): Promise<void>;
  isExpired(sessionId: string): Promise<boolean>;
}
```

**`StandInGenerator` (scrub-engine internal)**
```typescript
interface StandInGenerator {
  generate(original: string, category: Category, mapping: SessionMapping): string;
}
```

**`StreamingRestoreBuffer` (scrub-engine, used by web)**
```typescript
interface StreamingRestoreBuffer {
  push(chunk: string): string;
  flush(): string;
}
```

**`RouterDecision` (lib/router.ts)**
```typescript
interface RouterDecision {
  route: 'LOCAL_ANSWER' | 'CLOUD_SCRUBBED' | 'BLOCK';
  reason: string;
  model?: string;
}
```

**`AirlockSession` (useAirlockSession hook)**
```typescript
interface AirlockSession {
  turns: Turn[];
  submit(text: string, override?: RouteDecision): Promise<void>;
  previewFindings(text: string): Finding[];
  chamberState: ChamberState;
  protectionLevel: ProtectionLevel;
  sessionId: string;
  forgetSession(): void;
}
```

---

## Data Models

All data models are defined in `scrub-engine/src/types.ts` (shared) and `apps/web/src/firebase/firestore.ts` (Firestore). Key models:

**`Finding`** (scrub-engine)
```typescript
interface Finding {
  start: number;      // start offset in source text
  end: number;        // end offset (exclusive)
  text: string;       // detected substring
  category: Category; // one of 26 categories
  detector: DetectorType; // RULE | NANO
  confidence: number; // 0–1
}
```

**`SessionMapping`** (scrub-engine)
```typescript
interface SessionMapping {
  forward: Map<string, string>;   // original → stand-in
  reverse: Map<string, string>;   // stand-in → original
  aliases: Map<string, string>;   // alias → original (first name, surname)
  originals: Set<string>;          // all originals seen (for collision check)
  seed: number;                    // PRNG seed, stored in vault
}
```

**`ScrubResult`** (scrub-engine)
```typescript
interface ScrubResult {
  text: string;
  findings: Finding[];
  mapping: SessionMapping;
  actions: Array<{ finding: Finding; action: Action; replacement?: string }>;
}
```

**`Receipt`** (web/lib/receipts.ts)
```typescript
interface Receipt {
  id: string;
  timestamp: number;
  routeDecision: RouteDecision;
  routeReason: string;
  inferenceSource: Record<string, 'ON_DEVICE' | 'IN_CLOUD'>;
  outboundPayload: ScrubbedText;
  categoryCounts: Partial<Record<Category, number>>;
  detectorsUsed: DetectorType[];
  protectionLevel: 'Full' | 'Reduced';
}
```

**`OrgDoc` / `MemberDoc` / `StatsDoc`** (web/src/firebase/firestore.ts)
Match BRIEF §9.2 exactly. `StatsDoc.counts` is `Partial<Record<Category, number>>`; no string values permitted.

**`Settings`** (web/lib/settings.ts)
```typescript
interface Settings {
  sessionTtlHours: number;
  categoryOverrides: Partial<Record<Category, Action>>;
  showStandIns: boolean;
  language: string;
}
```

**Pool JSON format** (`scrub-engine/src/pools/*.json`)
Each pool is a flat `string[]`. Minimum 1 entry in skeleton; scrub-engine spec fills to ≥300.

---

## Traceability table (BRIEF section → file)

| BRIEF section | File(s) |
|---|---|
| §1 One line / tagline | `features/onboarding/LandingPage.tsx` |
| §2 The problem | `features/onboarding/LandingPage.tsx`, `HowItWorksPage.tsx` |
| §3 The insight / hybrid router | `lib/router.ts`, `ui/AirlockChamber/AirlockChamber.tsx` |
| §4 Who it's for | `features/onboarding/LandingPage.tsx` |
| §5 Hackathon constraints | `firebase/appCheck.ts`, `firebase/init.ts`, `docs/KIRO_LOG.md` |
| §6 Platform facts / SDK | `nano-detector/src/availability.ts`, `init.ts`, `detection.ts` |
| §7 P0-1 Scrub engine | `scrub-engine/src/scrub.ts`, `detectors/*`, `merge.ts`, `policy.ts` |
| §7 P0-2 Stand-ins | `scrub-engine/src/stand-ins.ts`, `src/pools/*.json` |
| §7 P0-3 Restore | `scrub-engine/src/restore.ts`, `features/chat/RestoredSpan.tsx` |
| §7 P0-4 Encrypted vault | `lib/vault.ts` (implements `scrub-engine/VaultInterface`) |
| §7 P0-5 Hybrid router | `lib/router.ts` |
| §7 P0-6 Airlock Chat | `features/chat/ChatPage.tsx`, `Composer.tsx`, `Turn.tsx`, `useAirlockSession.ts` |
| §7 P0-7 Receipt | `lib/receipts.ts`, `features/receipts/ReceiptsPage.tsx`, `ReceiptView.tsx` |
| §7 P0-8 Clipboard airlock | `features/clipboard/ClipboardAirlock.tsx` |
| §7 P0-9 Protection status + onboarding | `features/onboarding/ProtectionStatus.tsx`, `EnableNanoButton.tsx`, `useProtectionStatus.ts`, `LandingPage.tsx` |
| §7 P0-10 Firebase wiring | `firebase/init.ts`, `appCheck.ts`, `remoteConfig.ts`, `auth.ts` |
| §7 P1-1 Org mode | `features/org/*`, `lib/org-stats.ts`, `firebase/firestore.ts`, `firestore.rules` |
| §7 P1-2 Leak benchmark | `features/bench/BenchPage.tsx` |
| §7 P1-3 Settings | `features/settings/SettingsPage.tsx`, `lib/settings.ts` |
| §7 P1-4 Legal/trust pages | `features/onboarding/HowItWorksPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx` |
| §8.1 Detection layers A/B/C | `scrub-engine/src/detectors/*`, `nano-detector/src/detection.ts`, `scrub-engine/src/merge.ts` |
| §8.1 Verhoeff / Luhn | `scrub-engine/src/checksums/verhoeff.ts`, `luhn.ts` |
| §8.1 Entropy | `scrub-engine/src/checksums/entropy.ts` |
| §8.2 Stand-in generator + pools | `scrub-engine/src/stand-ins.ts`, `src/pools/*.json` |
| §8.3 Policy defaults + resolution | `scrub-engine/src/policy.ts` |
| §8.4 Hybrid router decision table | `lib/router.ts`, `nano-detector/src/classification.ts` |
| §8.5 Restore + streaming buffer | `scrub-engine/src/restore.ts` |
| §8.6 Invariants (PBT) | `scrub-engine/test/properties/` (skeleton test files) |
| §9.2 Firestore schema | `firebase/firestore.ts`, `firestore.rules` |
| §9.3 Remote Config keys | `firebase/remoteConfig.ts` |
| §9.4 App Check | `firebase/appCheck.ts` |
| §10.1 Pages/routes | `App.tsx` |
| §10.2 Design language | `ui/tokens.css` |
| §10.3 AirlockChamber animation | `ui/AirlockChamber/AirlockChamber.tsx` |
| §11.1 Repo structure | Entire file tree |
| §11.3 CSP / hosting headers | `firebase.json` |
| §11.4 Testing | `scrub-engine/test/unit/`, `test/properties/`, `apps/web/e2e/` |
| §12 Hooks (secret guard) | `scrub-engine/bin/check-prompt.mjs` |

---

## Correctness properties

The following properties from BRIEF §8.6 are traceable to requirements in this spec. They become runnable fast-check tests in the scrub-engine spec; this skeleton only creates the test file stubs.

| Property | Requirement | Test file |
|---|---|---|
| No leak | Req 1.8 (scrub entry point) | `test/properties/no-leak.test.ts` |
| Round trip | Req 1.7 (restore) | `test/properties/round-trip.test.ts` |
| Consistency | Req 1.6 (stand-in generator) | `test/properties/consistency.test.ts` |
| Injectivity | Req 1.6 (stand-in generator) | `test/properties/injectivity.test.ts` |
| Non-collision | Req 1.6 (stand-in generator) | `test/properties/non-collision.test.ts` |
| Fakes stay fake | Req 1.3 (checksum helpers) | `test/properties/fakes-stay-fake.test.ts` |
| Determinism | Req 1.6, 1.8 | `test/properties/determinism.test.ts` |
| Idempotence | Req 1.8 | `test/properties/idempotence.test.ts` |
| Streaming equivalence | Req 1.7 (streaming buffer) | `test/properties/streaming-equivalence.test.ts` |
