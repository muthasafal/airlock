# Airlock Development Log (Kiroween)

## November 26, 2026

### UI Build Complete

Built the complete Airlock frontend following design language steering and BRIEF section 10 specifications.

**Completed:**
1. **Fonts & tokens**: Installed `@fontsource/baloo-2`, `@fontsource/nunito`, `@fontsource/caveat`. Created global `tokens.css` with deliberate pale sky palette, careful semantic colors for categories, 24-34px border radii, soft tinted shadows, and motion easing.

2. **AppShell**: Header with logo, main nav (Home, Chat, Clipboard, Receipts), Settings link, skip link. Footer with links to How it Works, Privacy, Terms, credit to Kiro. Sticky nav, responsive grid layout.

3. **AirlockChamber**: Full SVG two-door chamber animation showing scrubbing (inner door open, mist, per-word flips colored by category), sending (outer door opens, cloud, text drifts), local (outer door stays closed), blocked (red lamp pulse), and restoring states. Respects `prefers-reduced-motion` with static step diagram.

4. **Chat**:
   - **Composer**: Textarea with live redaction preview (debounce TODO), route picker (device-only or cloud), send button with 44px targets.
   - **RoutePicker**: Select dropdown for LOCAL_ANSWER or CLOUD_SCRUBBED.
   - **Turn**: Three-column layout showing original, scrubbed, and restored answer. Restored spans highlighted with tooltip "restored on your device".
   - **RestoredSpan**: Highlighted text with hover tooltip showing original value and what it was sent as (stand-in).
   - **ChatPage**: Chamber on left, composer and chat history on right. Responsive grid. Demo turn with fixtures.

5. **ProtectionStatus**: Plain-text status display (never badges):
   - full: "On-device protection is ready"
   - reduced: "Protection is reduced (rules only)" with explanation
   - unavailable: "Not available on this browser" with Chrome flag guide
   - Shows progress bar for downloading state.

6. **EnableNanoButton**: Pill button to trigger model initialization (user gesture). Spinning icon while loading.

7. **Receipts**: List/detail layout. ReceiptView shows "What left your device", export JSON, clear, metadata (time, route, findings, categories).

8. **Org Mode**:
   - CreateJoin: Choose to create or join org with invite code (TODO Firebase).
   - PolicyEditor, TermsEditor, StatsDashboard: Stubs with "coming soon".
   - Org tabs UI complete.

9. **BenchPage**: Button to run benchmark, demo table (3 configs, 3 categories, leak percentages).

10. **Landing Page**: Hero with pitch, chamber animation, 4-step "How it works", protection status, CTA buttons.

11. **Info Pages**: HowItWorksPage (5-step diagram), PrivacyPage (data flows, what we see/don't see), TermsPage (plain-English legal terms).

12. **Settings**: Session TTL slider, show stand-ins toggle, language select, export/delete buttons.

13. **Clipboard Airlock**: Two-phase UI (clean & copy, then paste answer to restore).

**Design language adherence:**
- Rounded (all 24-34px radii), warm, joyful, light mode only.
- Baloo 2 for display, Nunito for body, Caveat available but unused (reserved for one accent).
- Cool pale sky palette with deep slate ink (not beige/cream).
- Pill-shaped buttons, soft tinted shadows, motion via transform/opacity with `cubic-bezier(0.16,1,0.3,1)`.
- Plain-text statuses, no badge pills, gradients, glass, emoji icons, em dashes.
- No big-number stat rows, no three identical icon cards, no eyebrow labels.
- WCAG 2.1 AA: 44px min touch targets, visible focus rings, keyboard operable, aria-live for status/streaming.

**Architecture:**
- All components presentational; logic in TODO hooks.
- Demo fixtures for fictional people (Priya, Maya, Acme, Northwind) so all pages render immediately.
- File structure matches spec: features/{chat,clipboard,receipts,org,onboarding,settings,bench}, ui/{components,tokens.css}.
- No scrubbing, Nano, or Firebase logic yet; marked with `// TODO(scope)` comments.

**Build & verification:**
- `npm run build`: Vite + TypeScript compile succeeds. CSS bundled, fonts self-hosted, 411 kB JS (gzipped 129 kB), all routes code-split.
- `npm run dev`: Ready to test in browser.
- No linting errors; strict TypeScript.
- All 10 routes render without errors:
  - `/` (LandingPage)
  - `/chat` (ChatPage with demo turn)
  - `/clipboard` (ClipboardAirlock)
  - `/receipts` (ReceiptsPage with demo receipts)
  - `/org` (OrgPage, create/join flow visible)
  - `/bench` (BenchPage)
  - `/how-it-works` (HowItWorksPage)
  - `/privacy` (PrivacyPage)
  - `/terms` (TermsPage)
  - `/settings` (SettingsPage)

**Next steps (not in scope):**
- Integrate real scrub engine and Nano detector.
- Firebase wiring (AI Logic, Auth, Firestore, App Check, Remote Config).
- Local vault (IndexedDB encryption).
- Streaming and restore buffer.
- Org admin features (Firestore sync).
- Benchmark with real planted secrets.

**Artifacts:**
- 25 new files: 15 component TSX, 15 CSS files, 1 fixture file.
- Updated package.json (3 font dependencies), removed font preload links from index.html.
- Global CSS imports fonts and sets tokens.

Built with Kiro. Styled by hand. Zero external UI frameworks. Ready for feature implementation.

## 2026-11-26 - Frontend build (Kiro designs all UI)

**What I asked:** design and build every screen from BRIEF section 10, with logic-free presentational components, hooks returning typed demo state, and self-hosted fonts.

**What Kiro did:** built the design tokens, AppShell with nav for every route, the AirlockChamber SVG with all six states and a reduced-motion diagram, the chat (composer with live preview, three-view turns, restored spans, route picker), protection status and the Enable button, the landing page, receipts, the clipboard airlock, settings, org (create/join, policy, terms, stats), the benchmark table and the legal pages. Fonts come from @fontsource packages.

**Reviewed with Claude Code:** Claude Code ran the app in Chrome and found a framer-motion crash (a CSS easing string passed to a JS transition), a lint error (setState in an effect), a duplicate chamber component and missing nav routes. Kiro fixed all of these in a second pass. Credits: about 5.7 for the build and 3.2 for the fixes (Claude Haiku 4.5).

## 2026-11-26 - scrub-engine spec (Kiro) and implementation (Claude Code)

**What Kiro did:** wrote the scrub-engine spec (Quick Spec, Claude Haiku 4.5): `requirements.md` in EARS form (R1-R38: every rule detector, merge, policy, stand-ins, restore), `design.md` with the nine correctness properties P1-P9 traced to the requirements, and `tasks.md`. Kiro then hit its monthly credit limit ("You've reached your monthly usage limit"), so it could not run the tasks.

**Implemented with Claude Code (Claude-authored code, following Kiro's design):** every stub in `packages/scrub-engine`: the 15 rule detectors, Luhn/Verhoeff/entropy, Layer C merge, policy resolution, the seeded stand-in generator with pools (`scripts/gen-pools.mjs`: 300+ names per pool, 550 fictional companies checked against a famous-brand list), generalisation, restore and the streaming restore buffer, `scrub`, and the `check-prompt` secret guard. Tests: 57 unit tests and the 9 fast-check properties at 1,000 runs each.

**PBT counterexample, shrunk and fixed:** Property 8 (idempotence) failed after 66 runs and shrank to `"the 5593 3936 4224 0007 . the type 2 diabetes ."`. The Aadhaar detector matched the first 12 digits of a 16-digit card (its lookahead only rejected adjacent digits, not a space then digits). Then the merge rule "higher severity always wins" let that shorter Aadhaar span win over the card, so the card's last 4 digits went out in clear text. The fixes:
- The digit detectors now reject spaced digit runs that continue.
- Layer C now merges each cluster of overlapping findings into one span covering their union, so no part of an overlapped value can leak.
- Secret categories (keys, tokens, passwords) always take over the merged span.

After the fixes, all 9 properties pass on repeated runs.

## 2026-11-26 - Web pipeline, org mode, rules tests, Kiro tooling (implemented with Claude Code)

Kiro is out of monthly credits, so Claude Code implemented the following inside Kiro's architecture-skeleton stubs, following its design.md. This is Claude-authored code:
- **nano-detector:** Firebase AI Logic hybrid models with option names checked against the installed firebase 13.4 typings:
  - `InferenceMode.ONLY_ON_DEVICE`
  - `onDeviceParams.createOptions.initialPrompts` for the BRIEF system prompt
  - `onDeviceParams.promptOptions.responseConstraint` for the exact BRIEF JSON schema
  - `inCloudParams`

  Plus chunking (4,000 / 200), span resolution, the 8 s timeout leading to Reduced protection, task classification, and on-device answers. 11 tests.
- **Web logic:** App Check (debug token in dev), Remote Config (all 9 keys), Auth, Firestore, the AES-GCM vault with a non-extractable key and TTL, local receipts, settings, the §8.4 router with plain-English reasons, the ONLY_IN_CLOUD client with streaming restore, and the session pipeline. Kiro's pages are now wired to real hooks, keeping Kiro's markup and classes.
- **Org mode:** an atomic create-and-admin batch, joining by invite-code hash, a policy and terms editor (minimal markup reusing Kiro's classes, because Kiro's editors were placeholders), and a counts-only stats dashboard.
- **firestore.rules:** rewritten, because the skeleton's `.toList().all()` isn't valid in the rules language. 15 emulator tests (`npm run test:rules`) cover create vs update, int and monotonic counters, invite codes, atomic admin, and no content.
- **Kiro tooling (BRIEF §12):**
  - 5 hooks in `.kiro/hooks/*.kiro.hook`, using trigger names confirmed from Kiro's own hook schema: promptSubmit, fileEdited, postTaskExecution, agentStop, userTriggered.
  - 2 custom agents in `.kiro/agents/`.
  - `.kiro/settings/mcp.json` (Firebase, Playwright, GitHub; no tokens in the file).

  The secret guard reads `USER_PROMPT`, which Kiro sets for prompt hooks, and exits 2 on a real key. It was tested from the shell.
