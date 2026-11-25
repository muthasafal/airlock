# Implementation Plan: architecture-skeleton

## Overview

Create every planned file of Airlock as a wired, type-correct skeleton. Tasks run roughly in dependency order: hygiene first, then scrub-engine (no deps), then nano-detector (depends on scrub-engine types), then web firebase/lib/ui/features (depend on both packages), then infrastructure fixes, then build verification.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12", "3.13", "3.14", "3.15", "3.16", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "5.1", "5.2", "5.3", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9"] },
    { "id": 2, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8"] },
    { "id": 3, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "10.1", "10.2", "10.3", "10.4", "11.1", "11.2", "11.3", "11.4", "11.5", "11.6", "12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7", "13.1", "13.2", "13.3", "13.4", "13.5", "13.6", "14.1", "14.2", "14.3", "14.4", "14.5", "15.1", "15.2", "16.1", "16.2", "16.3", "16.4", "17.1", "17.2"] },
    { "id": 4, "tasks": ["18.1", "18.2", "18.3", "18.4"] },
    { "id": 5, "tasks": ["19.1"] }
  ]
}
```

## Tasks

- [x] 1. Hygiene: steering, .gitignore, cleanup
  - [x] 1.1 Remove the duplicate `loadMode:` front-matter block from every `.kiro/steering/*.md` file (keep the `inclusion:` block only)
  - [x] 1.2 Add `*.tsbuildinfo` and `graphify-out/` to `.gitignore`
  - [x] 1.3 Delete `SETUP_COMPLETE.md` and `REVIEW_FIXES_SUMMARY.md` from the repo root if they exist
  - [x] 1.4 Fix `eslint.config.js` to also ignore `**/*.tsbuildinfo` and `graphify-out/**`

- [x] 2. scrub-engine: types and checksums
  - [x] 2.1 Extend `packages/scrub-engine/src/types.ts` with `Detector`, `VaultInterface`, `PolicySources`, `StandInGenerator`, `StreamingRestoreBuffer`, `ScrubInput` interfaces
  - [x] 2.2 Create `packages/scrub-engine/src/checksums/luhn.ts` with stub `luhnCheck` and `luhnFail`
  - [x] 2.3 Create `packages/scrub-engine/src/checksums/verhoeff.ts` with stub `verhoeffCheck` and `verhoeffFail`
  - [x] 2.4 Create `packages/scrub-engine/src/checksums/entropy.ts` with stub `shannonEntropy`

- [x] 3. scrub-engine: rule detector stubs (one file per Layer A category)
  - [x] 3.1 Create `src/detectors/email.ts` exporting `detectEmail(text, config?): Finding[]` stub
  - [x] 3.2 Create `src/detectors/phone.ts` exporting `detectPhone` stub
  - [x] 3.3 Create `src/detectors/aadhaar.ts` exporting `detectAadhaar` stub
  - [x] 3.4 Create `src/detectors/pan.ts` exporting `detectPan` stub
  - [x] 3.5 Create `src/detectors/ifsc.ts` exporting `detectIfsc` stub
  - [x] 3.6 Create `src/detectors/bank-account.ts` exporting `detectBankAccount` stub
  - [x] 3.7 Create `src/detectors/card.ts` exporting `detectCard` stub
  - [x] 3.8 Create `src/detectors/upi.ts` exporting `detectUpi` stub
  - [x] 3.9 Create `src/detectors/api-key.ts` exporting `detectApiKey` stub
  - [x] 3.10 Create `src/detectors/jwt.ts` exporting `detectJwt` stub
  - [x] 3.11 Create `src/detectors/private-key.ts` exporting `detectPrivateKey` stub
  - [x] 3.12 Create `src/detectors/password.ts` exporting `detectPassword` stub
  - [x] 3.13 Create `src/detectors/ip-address.ts` exporting `detectIpAddress` stub
  - [x] 3.14 Create `src/detectors/url-secret.ts` exporting `detectUrlSecret` stub
  - [x] 3.15 Create `src/detectors/org-term.ts` exporting `detectOrgTerm` stub
  - [x] 3.16 Create `src/detectors/index.ts` re-exporting all 15 functions and `ALL_RULE_DETECTORS`

- [x] 4. scrub-engine: core logic stubs
  - [x] 4.1 Create `packages/scrub-engine/src/merge.ts` with stub `mergeFindings` and `CATEGORY_SEVERITY` export
  - [x] 4.2 Create `packages/scrub-engine/src/policy.ts` with `DEFAULT_POLICY` record and stub `resolveAction`
  - [x] 4.3 Create stub pool JSON files in `packages/scrub-engine/src/pools/`: `indian-first-names.json`, `indian-surnames.json`, `western-first-names.json`, `western-surnames.json`, `company-names.json`, `cities.json`, `codenames.json` (one placeholder entry each)
  - [x] 4.4 Create `packages/scrub-engine/src/stand-ins.ts` with stub `createStandInGenerator`
  - [x] 4.5 Create `packages/scrub-engine/src/restore.ts` with stub `restore` and stub `createStreamingRestoreBuffer`
  - [x] 4.6 Create `packages/scrub-engine/src/scrub.ts` with stub `scrub` async function

- [x] 5. scrub-engine: entry point and bin script
  - [x] 5.1 Update `packages/scrub-engine/src/index.ts` to export all public types, interfaces, and functions from types, checksums, detectors, merge, policy, stand-ins, restore, and scrub
  - [x] 5.2 Create `packages/scrub-engine/bin/check-prompt.mjs` with stub that reads `USER_PROMPT` env var and exits 2 if secrets found
  - [x] 5.3 Add `"bin": { "check-prompt": "./bin/check-prompt.mjs" }` to `packages/scrub-engine/package.json`

- [x] 6. scrub-engine: PBT stub test files
  - [x] 6.1 Create `packages/scrub-engine/test/properties/no-leak.test.ts` stub (imports fast-check, describes property, throws not-implemented)
  - [x] 6.2 Create `packages/scrub-engine/test/properties/round-trip.test.ts` stub
  - [x] 6.3 Create `packages/scrub-engine/test/properties/consistency.test.ts` stub
  - [x] 6.4 Create `packages/scrub-engine/test/properties/injectivity.test.ts` stub
  - [x] 6.5 Create `packages/scrub-engine/test/properties/non-collision.test.ts` stub
  - [x] 6.6 Create `packages/scrub-engine/test/properties/fakes-stay-fake.test.ts` stub
  - [x] 6.7 Create `packages/scrub-engine/test/properties/determinism.test.ts` stub
  - [x] 6.8 Create `packages/scrub-engine/test/properties/idempotence.test.ts` stub
  - [x] 6.9 Create `packages/scrub-engine/test/properties/streaming-equivalence.test.ts` stub

- [x] 7. nano-detector: all stubs
  - [x] 7.1 Create `packages/nano-detector/src/availability.ts` with `NanoAvailability` type and stub `checkAvailability`
  - [x] 7.2 Create `packages/nano-detector/src/init.ts` with stub `initializeDeviceModel`
  - [x] 7.3 Create `packages/nano-detector/src/detection.ts` with Zod schemas (`NanoFindingSchema`, `NanoResponseSchema`), `NanoFinding` type, `NanoDetectionResult` interface, and stub `detectWithNano`
  - [x] 7.4 Create `packages/nano-detector/src/span-resolution.ts` with stub `resolveSpans`
  - [x] 7.5 Create `packages/nano-detector/src/chunking.ts` with `Chunk`, `ChunkedDetectionResult` interfaces, stub `chunkText`, stub `detectChunked`
  - [x] 7.6 Create `packages/nano-detector/src/classification.ts` with `TaskType`, `Complexity`, `TaskClassification` types and stub `classifyTask`
  - [x] 7.7 Rewrite `packages/nano-detector/src/index.ts` to export `NanoDetector` class (implements `Detector` from scrub-engine) and all public functions
  - [x] 7.8 Add `@airlock/scrub-engine` as a dependency in `packages/nano-detector/package.json`

- [x] 8. apps/web/src/firebase stubs
  - [x] 8.1 Create `apps/web/src/firebase/init.ts` with stub Firebase app initialisation exporting `app: FirebaseApp`
  - [x] 8.2 Create `apps/web/src/firebase/appCheck.ts` with stub `initAppCheck` (dev debug token, prod ReCaptchaV3)
  - [x] 8.3 Create `apps/web/src/firebase/remoteConfig.ts` with `RemoteConfigValues` interface, all 9 keys with defaults, and typed accessor stubs
  - [x] 8.4 Create `apps/web/src/firebase/auth.ts` with stub `signInWithGoogle` and `signOut`
  - [x] 8.5 Create `apps/web/src/firebase/firestore.ts` with `OrgDoc`, `MemberDoc`, `StatsDoc` interfaces and stub `getOrgRef`, `getMemberRef`, `getStatsRef`

- [x] 9. apps/web/src/lib stubs
  - [x] 9.1 Create `apps/web/src/lib/router.ts` with `RouteDecision`, `RouterInput`, `RouterDecision` types and stub `routeRequest`
  - [x] 9.2 Create `apps/web/src/lib/cloud-client.ts` with `ScrubbedText` branded type, `asScrubbed`, `ScrubbedHistoryEntry`, and stub `sendScrubbed`
  - [x] 9.3 Create `apps/web/src/lib/vault.ts` with `Vault` interface and stub `createVault`
  - [x] 9.4 Create `apps/web/src/lib/receipts.ts` with `ProtectionLevel`, `Receipt` interface and stub `saveReceipt`, `listReceipts`, `clearReceipts`
  - [x] 9.5 Create `apps/web/src/lib/settings.ts` with `Settings` interface and stub `getSettings`, `updateSettings`
  - [x] 9.6 Create `apps/web/src/lib/org-stats.ts` with stub `incrementStats`

- [x] 10. apps/web/src/ui
  - [x] 10.1 Create `apps/web/src/ui/tokens.css` with all CSS custom properties for fonts, palette, radii, easing, and durations
  - [x] 10.2 Create `apps/web/src/ui/components/AppShell.tsx` with typed props and stub body
  - [x] 10.3 Create `apps/web/src/ui/AirlockChamber/AirlockChamber.tsx` with `ChamberState` type, typed props, and stub body
  - [x] 10.4 Create `apps/web/src/ui/AirlockChamber/index.ts` re-exporting from AirlockChamber.tsx

- [x] 11. apps/web features: chat
  - [x] 11.1 Create `apps/web/src/features/chat/ChatPage.tsx` stub (no props)
  - [x] 11.2 Create `apps/web/src/features/chat/Turn.tsx` stub with typed `TurnProps`
  - [x] 11.3 Create `apps/web/src/features/chat/RestoredSpan.tsx` stub with typed `RestoredSpanProps`
  - [x] 11.4 Create `apps/web/src/features/chat/Composer.tsx` stub with typed `ComposerProps`
  - [x] 11.5 Create `apps/web/src/features/chat/RoutePicker.tsx` stub with typed `RoutePickerProps`
  - [x] 11.6 Create `apps/web/src/features/chat/useAirlockSession.ts` stub hook with `AirlockSession` interface

- [x] 12. apps/web features: onboarding/landing/legal
  - [x] 12.1 Create `apps/web/src/features/onboarding/LandingPage.tsx` stub
  - [x] 12.2 Create `apps/web/src/features/onboarding/ProtectionStatus.tsx` stub with typed props
  - [x] 12.3 Create `apps/web/src/features/onboarding/EnableNanoButton.tsx` stub
  - [x] 12.4 Create `apps/web/src/features/onboarding/useProtectionStatus.ts` stub hook with `ProtectionStatusHook` interface
  - [x] 12.5 Create `apps/web/src/features/onboarding/HowItWorksPage.tsx` stub
  - [x] 12.6 Create `apps/web/src/features/onboarding/PrivacyPage.tsx` stub
  - [x] 12.7 Create `apps/web/src/features/onboarding/TermsPage.tsx` stub

- [x] 13. apps/web features: receipts, clipboard, settings, bench
  - [x] 13.1 Create `apps/web/src/features/receipts/ReceiptsPage.tsx` stub
  - [x] 13.2 Create `apps/web/src/features/receipts/ReceiptView.tsx` stub with typed `ReceiptViewProps`
  - [x] 13.3 Create `apps/web/src/features/receipts/useReceipts.ts` stub hook
  - [x] 13.4 Create `apps/web/src/features/clipboard/ClipboardAirlock.tsx` stub
  - [x] 13.5 Create `apps/web/src/features/settings/SettingsPage.tsx` stub
  - [x] 13.6 Create `apps/web/src/features/bench/BenchPage.tsx` stub (default export, no props)

- [x] 14. apps/web features: org
  - [x] 14.1 Create `apps/web/src/features/org/OrgPage.tsx` stub
  - [x] 14.2 Create `apps/web/src/features/org/CreateJoin.tsx` stub with typed props
  - [x] 14.3 Create `apps/web/src/features/org/PolicyEditor.tsx` stub with typed props
  - [x] 14.4 Create `apps/web/src/features/org/TermsEditor.tsx` stub with typed props
  - [x] 14.5 Create `apps/web/src/features/org/StatsDashboard.tsx` stub with typed props

- [x] 15. Update App.tsx and routing
  - [x] 15.1 Rewrite `apps/web/src/App.tsx` with react-router `BrowserRouter` and all 10 routes (lazy `/bench`)
  - [x] 15.2 Update `apps/web/index.html` to load Google Fonts or add `<link rel="preload">` stubs for self-hosted fonts

- [x] 16. Firestore rules fixes (REVIEW item 1)
  - [x] 16.1 Rewrite `firestore.rules` to split stats `allow write` into separate `allow create` and `allow update` blocks
  - [x] 16.2 Add monotonic int check to the stats update rule (`is int && >= old value`)
  - [x] 16.3 Add invite-code hash check to the members create rule
  - [x] 16.4 Add org create rule that permits the atomic batch (org doc + first member doc)

- [x] 17. firebase.json CSP fix (REVIEW item 2)
  - [x] 17.1 Update `firebase.json` CSP header to add `script-src https://www.google.com https://www.gstatic.com` and `frame-src https://www.google.com https://recaptcha.google.com`
  - [x] 17.2 Update `font-src` to `'self'` only and create `apps/web/public/fonts/.gitkeep` placeholder

- [x] 18. Build verification
  - [x] 18.1 Run `npm run typecheck` and fix any type errors in skeleton files (no logic changes, only type corrections)
  - [x] 18.2 Run `npm run lint` and fix any lint errors
  - [x] 18.3 Run `npm run build` and confirm it passes
  - [x] 18.4 Run `npm run test:unit` and confirm it passes (--passWithNoTests)

- [x] 19. KIRO_LOG entry
  - [x] 19.1 Append a dated entry to `docs/KIRO_LOG.md` describing the architecture-skeleton spec: what files were created, what stubs were written, what hygiene issues were fixed
