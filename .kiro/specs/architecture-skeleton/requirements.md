# Requirements Document

## Introduction

This spec creates every planned file of Airlock as a wired, type-correct skeleton before any feature logic is written. Function bodies are stubs (`throw new Error("not implemented: architecture-skeleton")`), but every file has its real exported types, interfaces, and signatures, with a doc comment per function describing the exact logic it will implement. All subsequent specs (scrub-engine, nano-detector, hybrid-router, vault, firebase-platform, airlock-chat, clipboard-airlock, onboarding-status, org-mode, leak-benchmark, legal-pages) only fill in bodies.

Source: docs/BRIEF.md (all sections) + docs/REVIEW.md (Resume here + items 1–5).

## Requirements

### 1. scrub-engine package skeleton

#### 1.1 Types

- WHEN the scrub-engine package is built, THEN it SHALL export all types defined in BRIEF §8.1 and §8.2: `Category` (all 26 values: rule-layer categories EMAIL, PHONE, AADHAAR, PAN, IFSC, BANK_ACCOUNT, CARD, UPI, API_KEY, JWT, PRIVATE_KEY, PASSWORD, IP_ADDRESS, URL_SECRET, ORG_TERM; Nano-layer categories PERSON, ORG, LOCATION, HEALTH, FINANCIAL_AMOUNT, LEGAL_MATTER, INTERNAL_PROJECT, CREDENTIAL, GOVERNMENT_ID, DATE_OF_BIRTH, OTHER_SENSITIVE), `Action` (PSEUDONYMIZE | GENERALIZE | BLOCK | KEEP), `DetectorType` (RULE | NANO), `Finding`, `ScrubResult`, `RestoreResult`, `SessionMapping`, `Policy`, `PolicyRule`, `DetectorConfig`.
- WHEN the scrub-engine package is built, THEN it SHALL export a `Detector` interface with a `detect(text: string, config: DetectorConfig): Promise<Finding[]>` method so Layer B (Nano) can plug in without coupling the package to Firebase.
- WHEN the scrub-engine package is built, THEN it SHALL export a `VaultInterface` with methods `store`, `load`, `forget`, and `isExpired` so the vault spec can implement it without the scrub-engine depending on IndexedDB.

#### 1.2 Rule detectors

- WHEN text is processed by the scrub-engine, THEN the system SHALL run one dedicated detector file per BRIEF §8.1 Layer A category: `detectors/email.ts`, `detectors/phone.ts`, `detectors/aadhaar.ts`, `detectors/pan.ts`, `detectors/ifsc.ts`, `detectors/bank-account.ts`, `detectors/card.ts`, `detectors/upi.ts`, `detectors/api-key.ts`, `detectors/jwt.ts`, `detectors/private-key.ts`, `detectors/password.ts`, `detectors/ip-address.ts`, `detectors/url-secret.ts`, `detectors/org-term.ts`.
- WHEN each rule detector module is loaded, THEN it SHALL export a named function (e.g. `detectEmail`) with the signature `(text: string, config?: DetectorConfig) => Finding[]`.
- WHEN any rule detector runs, THEN it SHALL be a pure function with no I/O, no network calls, and no DOM dependencies, consistent with BRIEF §11.1 package boundaries.

#### 1.3 Checksum helpers

- WHEN a card number is validated or generated, THEN the system SHALL use a `checksums/luhn.ts` module exporting `luhnCheck(digits: string): boolean` and `luhnFail(digits: string): boolean`.
- WHEN an Aadhaar number is validated or generated, THEN the system SHALL use a `checksums/verhoeff.ts` module exporting `verhoeffCheck(digits: string): boolean` and `verhoeffFail(digits: string): boolean`.
- WHEN API_KEY detection runs for high-entropy strings, THEN the system SHALL use a `checksums/entropy.ts` module exporting `shannonEntropy(s: string): number`.

#### 1.4 Merge

- WHEN findings from multiple detectors are combined, THEN `merge.ts` SHALL export `mergeFindings(findings: Finding[], config: DetectorConfig): Finding[]` implementing the BRIEF §8.1 Layer C rules: union, sort by start, prefer longer span on overlap, prefer rules over Nano for structured types on equal length, prefer higher-severity category, drop below `nanoMinConfidence`.

#### 1.5 Policy

- WHEN policy is resolved for a finding, THEN `policy.ts` SHALL export `DEFAULT_POLICY: Record<Category, Action>` matching the BRIEF §8.3 defaults table, and `resolveAction(category: Category, sources: PolicySources): Action` implementing the BRIEF §8.3 resolution order: org policy > user settings > Remote Config defaults > built-in defaults.

#### 1.6 Stand-in generator

- WHEN stand-ins are generated, THEN `stand-ins.ts` SHALL export `createStandInGenerator(seed: number): StandInGenerator` returning an object with method `generate(original: string, category: Category, mapping: SessionMapping): string`.
- WHEN pool data is needed, THEN pool files SHALL be shipped as JSON in `src/pools/`: `indian-first-names.json`, `indian-surnames.json`, `western-first-names.json`, `western-surnames.json`, `company-names.json`, `cities.json`, `codenames.json`.
- WHEN a stand-in is generated, THEN the generator SHALL check collision against existing originals and stand-ins (case-insensitive), retrying up to 20 times then using a numbered fallback, as specified in BRIEF §8.2.

#### 1.7 Restore

- WHEN a model answer is restored, THEN `restore.ts` SHALL export `restore(text: string, mapping: SessionMapping): RestoreResult` implementing the BRIEF §8.5 algorithm: reverse map, longest-match regex, word-boundary aware, case-preserving, possessives and plurals.
- WHEN model output streams, THEN `restore.ts` SHALL export `createStreamingRestoreBuffer(mapping: SessionMapping, maxStandInLength: number): StreamingRestoreBuffer` with methods `push(chunk: string): string` and `flush(): string`, implementing BRIEF §8.5 streaming invariant.

#### 1.8 Entry points

- WHEN the scrub-engine is used as a library, THEN `src/index.ts` SHALL re-export all public types, the `Detector` interface, `VaultInterface`, `mergeFindings`, `resolveAction`, `DEFAULT_POLICY`, `createStandInGenerator`, `scrub`, and `restore`.
- WHEN the `scrub` function is called, THEN it SHALL accept `(text: string, detectors: Detector[], mapping: SessionMapping, policy: Policy): Promise<ScrubResult>`.
- WHEN `bin/check-prompt.mjs` is executed, THEN it SHALL read `USER_PROMPT` from the environment, run rule-only detection, and exit with code 2 if any finding with action BLOCK or PSEUDONYMIZE is found.

---

### 2. nano-detector package skeleton

#### 2.1 Availability

- WHEN the nano-detector is loaded, THEN `availability.ts` SHALL export `checkAvailability(): Promise<NanoAvailability>` where `NanoAvailability` is `'available' | 'downloadable' | 'downloading' | 'unavailable'`, wrapping `LanguageModel.availability()`.

#### 2.2 Initialisation

- WHEN the user triggers Nano download, THEN `init.ts` SHALL export `initializeDeviceModel(onProgress?: (pct: number) => void): Promise<void>` calling `model.initializeDeviceModel()` after a user gesture, as required by BRIEF §6.
- WHEN initialisation progress is available, THEN the function SHALL call `onProgress` with a 0 to 100 percentage value.

#### 2.3 Structured detection

- WHEN Nano detection runs, THEN `detection.ts` SHALL export `detectWithNano(text: string, model: GenerativeModel): Promise<NanoDetectionResult>` sending the BRIEF §8.1 Layer B system prompt and JSON schema using `InferenceMode.ONLY_ON_DEVICE`.
- WHEN Nano returns JSON, THEN it SHALL be validated with Zod against the BRIEF §8.1 schema before use, rejecting invalid output as required by BRIEF §11.3.
- WHEN Nano detection times out (8 seconds per chunk), THEN the function SHALL resolve with partial findings and set a `timedOut: true` flag, per BRIEF §8.1.

#### 2.4 Span resolution

- WHEN Nano returns text spans, THEN `span-resolution.ts` SHALL export `resolveSpans(nanoFindings: NanoFinding[], source: string): Finding[]` locating each by exact search then case-insensitive fallback, ignoring hallucinated spans not found in source, per BRIEF §8.1.

#### 2.5 Chunking

- WHEN input text exceeds 4,000 characters, THEN `chunking.ts` SHALL export `chunkText(text: string, chunkSize?: number, overlap?: number): Chunk[]` splitting on paragraph boundaries with 4,000-char chunks and 200-char overlap, per BRIEF §8.1.
- WHEN multiple chunks are processed, THEN `detectChunked(text: string, model: GenerativeModel, onProgress?: (pct: number) => void): Promise<ChunkedDetectionResult>` SHALL process sequentially and merge results.

#### 2.6 Task classification

- WHEN a request is routed, THEN `classification.ts` SHALL export `classifyTask(text: string, model: GenerativeModel): Promise<TaskClassification>` returning `{ task: TaskType, complexity: Complexity }` using `ONLY_ON_DEVICE` with the BRIEF §8.4 enum schema.
- WHEN classification types are defined, THEN `TaskType` SHALL be `'REWRITE' | 'SUMMARIZE_SHORT' | 'TRANSLATE_SHORT' | 'QA_ON_TEXT' | 'REASONING' | 'CODE' | 'CREATIVE_LONG' | 'OTHER'` and `Complexity` SHALL be `'LOW' | 'MEDIUM' | 'HIGH'`.

#### 2.7 Detector interface implementation

- WHEN nano-detector is used as a Layer B detector, THEN `index.ts` SHALL export a `NanoDetector` class implementing the scrub-engine `Detector` interface.

---

### 3. apps/web/src/firebase skeleton

#### 3.1 Initialisation

- WHEN the web app starts, THEN `firebase/init.ts` SHALL initialise the Firebase app exactly once from environment variables and export `app: FirebaseApp`.

#### 3.2 App Check

- WHEN the app runs in development, THEN `firebase/appCheck.ts` SHALL set `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` before initialising App Check, without committing any token value, per BRIEF §9.4.
- WHEN the app runs in production, THEN it SHALL initialise App Check with `ReCaptchaV3Provider`, per BRIEF §9.4.

#### 3.3 Remote Config

- WHEN remote config is loaded, THEN `firebase/remoteConfig.ts` SHALL define and export every key from BRIEF §9.3 with its documented default: `cloud_model`, `cloud_model_hard`, `nano_min_confidence`, `local_answer_max_chars`, `chunk_chars`, `block_request_on_secret`, `session_ttl_hours`, `feature_screenshot`, `feature_org_mode`.
- WHEN remote config values are accessed, THEN typed accessor functions SHALL be exported for each key so callers never read raw strings.

#### 3.4 Auth

- WHEN users sign in, THEN `firebase/auth.ts` SHALL export `signInWithGoogle(): Promise<UserCredential>` and `signOut(): Promise<void>` using the Firebase Google provider.

#### 3.5 Firestore

- WHEN Firestore types are used, THEN `firebase/firestore.ts` SHALL export TypeScript interfaces `OrgDoc`, `MemberDoc`, `StatsDoc` matching the BRIEF §9.2 schema exactly, plus helper functions `getOrgRef`, `getMemberRef`, `getStatsRef`.

---

### 4. apps/web/src/lib skeleton

#### 4.1 Hybrid router

- WHEN a message is submitted, THEN `lib/router.ts` SHALL export `routeRequest(input: RouterInput): Promise<RouterDecision>` implementing the BRIEF §8.4 two-step decision table (classify task, then pick LOCAL_ANSWER | CLOUD_SCRUBBED | BLOCK).
- WHEN a routing decision is made, THEN it SHALL include a `reason: string` in plain English, per BRIEF §8.4.
- WHEN Nano is unavailable, THEN the router SHALL require `consentGiven: boolean` on `RouterInput` before allowing CLOUD_SCRUBBED, per BRIEF §8.4.

#### 4.2 Cloud client

- WHEN CLOUD_SCRUBBED is selected, THEN `lib/cloud-client.ts` SHALL export `sendScrubbed(scrubbed: string, history: ScrubbedHistoryEntry[], model: string): AsyncIterable<string>` using `ONLY_IN_CLOUD` with the scrubbed history array, per BRIEF §P0-6.
- WHEN the cloud client is called, THEN it SHALL never accept or transmit raw text; the type system SHALL enforce this via a branded `ScrubbedText` type.

#### 4.3 Vault

- WHEN session data is stored, THEN `lib/vault.ts` SHALL export `createVault(): Vault` returning an object with `store`, `load`, `forget`, `forgetAll`, and `isExpired` methods.
- WHEN the vault stores a mapping, THEN it SHALL encrypt with AES-GCM using a non-extractable `CryptoKey` stored in IndexedDB, per BRIEF §P0-4.
- WHEN TTL elapses, THEN the vault SHALL refuse to load the mapping and delete it on next access, per BRIEF §P0-4.

#### 4.4 Receipts store

- WHEN a request completes, THEN `lib/receipts.ts` SHALL export `saveReceipt`, `listReceipts`, and `clearReceipts`, storing only in IndexedDB, never uploading, per BRIEF §P0-7.
- WHEN a receipt is defined, THEN `Receipt` SHALL contain: `id`, `timestamp`, `routeDecision`, `routeReason`, `inferenceSource`, `outboundPayload` (scrubbed text only), `categoryCounts`, `detectorsUsed`, `protectionLevel`, per BRIEF §P0-7.

#### 4.5 Settings store

- WHEN settings are read or written, THEN `lib/settings.ts` SHALL export `getSettings(): Settings` and `updateSettings(patch: Partial<Settings>): void` using localStorage, with `Settings` covering session TTL, per-category default action overrides, show-stand-ins toggle, and language, per BRIEF §P1-3.

#### 4.6 Org stats client

- WHEN org stats are incremented, THEN `lib/org-stats.ts` SHALL export `incrementStats(orgId: string, date: string, counts: Partial<Record<Category, number>>, route: RouteDecision): Promise<void>` using `FieldValue.increment()` only, never writing string fields, per BRIEF §9.2.

---

### 5. apps/web UI skeleton

#### 5.1 Routing

- WHEN the app loads, THEN `App.tsx` SHALL define react-router routes for every page in BRIEF §10.1: `/`, `/chat`, `/clipboard`, `/receipts`, `/org`, `/bench`, `/how-it-works`, `/privacy`, `/terms`, `/settings`.
- WHEN `/bench` is loaded, THEN it SHALL be lazy-loaded with `React.lazy`, per BRIEF §10.2.

#### 5.2 App shell

- WHEN any route renders, THEN `ui/components/AppShell.tsx` SHALL wrap it with a nav and layout, with typed props `{ children: React.ReactNode }`.

#### 5.3 Chat feature

- WHEN the chat page renders, THEN `features/chat/ChatPage.tsx` SHALL compose `Composer`, `TurnList`, and `ProtectionStatus` with no logic of its own.
- WHEN a turn is displayed, THEN `features/chat/Turn.tsx` SHALL show three views: original with highlighted spans, scrubbed version, and restored answer, per BRIEF §P0-6.
- WHEN a span is restored, THEN `features/chat/RestoredSpan.tsx` SHALL render restored text with hover/tap revealing "restored on your device", per BRIEF §P0-3.
- WHEN the user composes a message, THEN `features/chat/Composer.tsx` SHALL accept `onSubmit`, `onPreviewChange`, and `disabled` props; all state management lives in `useAirlockSession`.
- WHEN the router decision is displayed, THEN `features/chat/RoutePicker.tsx` SHALL show the current route and allow the user to override it.

#### 5.4 AirlockChamber

- WHEN the chamber is rendered, THEN `ui/AirlockChamber/AirlockChamber.tsx` SHALL accept `state: ChamberState` where `ChamberState = 'idle' | 'scrubbing' | 'sending' | 'local' | 'blocked' | 'restoring'` and animate between states with Framer Motion, per BRIEF §10.3.
- WHEN `prefers-reduced-motion` is set, THEN the chamber SHALL render a static step diagram variant, per BRIEF §10.3.
- WHEN door states reflect the router, THEN LOCAL_ANSWER SHALL keep the outer door closed, BLOCK SHALL show a red lamp, and CLOUD_SCRUBBED SHALL run the full animation, per BRIEF §10.3.

#### 5.5 Protection status

- WHEN Nano status is displayed, THEN `features/onboarding/ProtectionStatus.tsx` SHALL show plain-text status and an `EnableNanoButton` when status is `downloadable`, per BRIEF §P0-9.
- WHEN the user clicks Enable, THEN `features/onboarding/EnableNanoButton.tsx` SHALL call `initializeDeviceModel` after the click (user gesture), showing a progress indicator, per BRIEF §P0-9.

#### 5.6 Receipt view

- WHEN receipts are shown, THEN `features/receipts/ReceiptView.tsx` SHALL render a "What left your device" diff with originals on the left and sent text on the right, per BRIEF §P0-7.
- WHEN receipts are listed, THEN `features/receipts/ReceiptsPage.tsx` SHALL list receipts with export and clear actions.

#### 5.7 Clipboard airlock

- WHEN the clipboard page renders, THEN `features/clipboard/ClipboardAirlock.tsx` SHALL show a text input, a "Clean and copy" button, a restore input, and a "Restore" button, per BRIEF §P0-8.

#### 5.8 Org pages

- WHEN the org page renders, THEN `features/org/OrgPage.tsx` SHALL route between `CreateJoin`, `PolicyEditor`, `TermsEditor`, and `StatsDashboard` sub-views.
- WHEN create/join is shown, THEN `features/org/CreateJoin.tsx` SHALL accept `onCreateOrg` and `onJoinOrg` callbacks with no Firestore logic inside.
- WHEN policy is edited, THEN `features/org/PolicyEditor.tsx` SHALL accept `policy: Policy` and `onSave` props.
- WHEN protected terms are edited, THEN `features/org/TermsEditor.tsx` SHALL accept `terms: ProtectedTerm[]` and `onSave` props.
- WHEN stats are shown, THEN `features/org/StatsDashboard.tsx` SHALL accept `stats: StatsDoc[]` and render counts only, never content.

#### 5.9 Benchmark page

- WHEN the bench page renders, THEN `features/bench/BenchPage.tsx` SHALL show a table of category times configuration results (recall, precision, leaked count, latency), per BRIEF §P1-2.

#### 5.10 Settings page

- WHEN settings are shown, THEN `features/settings/SettingsPage.tsx` SHALL render a form bound to `Settings` with all fields defined in BRIEF §P1-3.

#### 5.11 Legal pages

- WHEN legal pages render, THEN `features/onboarding/HowItWorksPage.tsx`, `features/onboarding/PrivacyPage.tsx`, and `features/onboarding/TermsPage.tsx` SHALL each be a static presentational component, per BRIEF §P1-4.

#### 5.12 Landing page

- WHEN `/` renders, THEN `features/onboarding/LandingPage.tsx` SHALL show the one-line pitch, the AirlockChamber demo, a CTA to `/chat`, a three-step explainer, and ProtectionStatus, per BRIEF §10.1.

#### 5.13 Hooks

- WHEN chat session logic is needed, THEN `features/chat/useAirlockSession.ts` SHALL export a hook encapsulating detection, scrubbing, routing, sending, and restoring for a session.
- WHEN protection status logic is needed, THEN `features/onboarding/useProtectionStatus.ts` SHALL export a hook returning `NanoAvailability` and triggering availability checks.
- WHEN receipts logic is needed, THEN `features/receipts/useReceipts.ts` SHALL export a hook over the receipts store.

#### 5.14 Design tokens

- WHEN any UI component imports tokens, THEN `ui/tokens.css` SHALL define CSS custom properties for fonts (Baloo 2, Nunito, Caveat), the colour palette (pale mint/sky ground, deep ink, action colour, success colour, category semantic colours), border radii, easing, and transition durations, per BRIEF §10.2.

---

### 6. Firestore rules and CSP

#### 6.1 Firestore rules fixes

- WHEN a stats document is created for the first time, THEN `firestore.rules` SHALL handle the create case separately because `resource` is null on create, rather than calling `diff(resource.data)` on null, per REVIEW item 1.
- WHEN stats fields are written, THEN the rules SHALL assert each numeric field `is int` and that each new value is greater than or equal to the old value (monotonic increments), per REVIEW item 1.
- WHEN a user joins an org, THEN the rules SHALL require the invite code hash to match `inviteCodeHash` on the org document, rather than allowing any authenticated user to self-join, per REVIEW item 1.
- WHEN an org is created, THEN a batch write SHALL atomically create both the org document and the creator's admin member document, with rules permitting exactly this pattern, per REVIEW item 1.

#### 6.2 CSP

- WHEN the app is served, THEN `firebase.json` hosting headers SHALL include `script-src https://www.google.com https://www.gstatic.com` and `frame-src https://www.google.com https://recaptcha.google.com` for reCAPTCHA v3, per REVIEW item 2.
- WHEN fonts are served, THEN fonts SHALL be self-hosted in `apps/web/public/fonts/` so `font-src 'self'` remains strict, per REVIEW item 2.
- WHEN `connect-src` is set, THEN it SHALL cover exact Firebase AI Logic and App Check endpoints without unnecessary wildcards, per REVIEW item 2.

---

### 7. Hygiene

#### 7.1 Lint

- WHEN `npm run lint` is executed, THEN it SHALL pass with zero errors by ignoring `dist/`, `*.tsbuildinfo`, and `graphify-out/`, per REVIEW resume state.

#### 7.2 Steering file duplicates

- WHEN any `.kiro/steering` file is opened, THEN it SHALL contain exactly one front-matter block (the `inclusion:` block); the duplicate `loadMode:` block SHALL be removed, per REVIEW resume state.

#### 7.3 Scaffolding cleanup

- WHEN the repo is examined, THEN `SETUP_COMPLETE.md` and `REVIEW_FIXES_SUMMARY.md` SHALL not be present at the repo root, per REVIEW item 5.

#### 7.4 .gitignore

- WHEN build artefacts are considered, THEN `.gitignore` SHALL exclude `*.tsbuildinfo` and `graphify-out/`, per REVIEW resume state.

#### 7.5 KIRO_LOG entry

- WHEN this spec is complete, THEN `docs/KIRO_LOG.md` SHALL have a new entry dated 2026-11-25 describing what was built by this spec.
