# Review notes for Kiro

Findings from a review of the setup on 2026-11-25. Fix each one in the spec named next to it, then tick it off.

## Already fixed during the review
- [x] `docs/BRIEF.md` had been cut down to sections 1 to 4 with a "[Rest of brief content continues...]" placeholder. The full brief was restored from git. **Never shorten or rewrite BRIEF.md; it is the source of truth.**
- [x] `LICENSE` had been replaced with "Copyright 2024 Airlock Contributors". The original was restored (Copyright 2026 Safal Mutha).
- [x] `.gitignore` ignored `docs/`. Removed, because docs must be committed.
- [x] `.firebaserc` pointed at `your-project-id`. Now `airlock-app`.
- [x] `scrub-engine/src/index.ts` exported files that don't exist, so the build failed. The exports are commented out until the spec creates them.
- [x] `nano-detector` had no source file (tsc failed). A placeholder `src/index.ts` was added.
- [x] `apps/web` was missing `vite-env.d.ts` (the CSS import failed the type check). Added.
- [x] The steering files had no YAML front matter, so all of them loaded on every request, **including the full brief**, which wastes credits. Front matter was added: `brief.md` is `manual`, `design.md` is `fileMatch`, and the rest are `always`.
- [x] Dates said 2024 (README, tech.md, KIRO_LOG). Corrected to 2026.
- [x] Root `test` scripts failed when no tests existed. `--passWithNoTests` was added, plus a `typecheck` script.

## To fix in upcoming specs
1. **`org-mode` spec: Firestore rules bugs**
   - Writing to a day's stats doc for the first time is denied: on create, `resource` is null, so `diff(resource.data)` fails. Handle create separately.
   - `counts` and `routes` values aren't checked to be numbers, and increments aren't enforced. Check `is int`, and that each new value is at least the old value.
   - **Any signed-in user can add themselves as a member of any org.** Joining must require the invite code: hash it in the client, compare it to `inviteCodeHash`, or route the join through a callable function.
   - Creating an org doesn't make the creator an admin atomically. Use a batch with a rule that allows exactly that.
   - Write emulator tests for every rule (BRIEF section 11.4).
2. **`firebase-platform` spec: CSP**
   - App Check's reCAPTCHA v3 needs `script-src https://www.google.com https://www.gstatic.com` and `frame-src https://www.google.com https://recaptcha.google.com`.
   - Self-host the fonts (Baloo 2, Nunito, Caveat) so `font-src 'self'` stays strict.
   - Confirm `connect-src` covers the exact AI Logic and App Check endpoints, and remove any wildcard that isn't needed.
3. **Kiro features not set up yet** (playbook steps A4 to A6):
   - `.kiro/hooks/` (secret-guard, test-on-save, props-after-task, privacy-review-on-stop, docs-sync)
   - `.kiro/agents/` (leak-auditor, copy-editor)
   - `.kiro/settings/mcp.json` (Firebase, Playwright, GitHub)
   These are judged for Kiroween.
4. **Lint:** `eslint` is installed but has no `eslint.config.js`, so `npm run lint` fails. Add a flat config (typescript-eslint, react-hooks) and Prettier.
5. **Before submitting:** delete `SETUP_COMPLETE.md` (a scaffolding note), and replace "Architecture diagram coming soon" in the README with the real diagram.

## Resume here (updated 2026-11-26)

**State: feature-complete for the Firebase submission. Everything is green and pushed to origin/main:**
- `npm run typecheck`, `lint` and `build`
- `npm run test:unit`: 78 tests, including the 9 PBT properties at 1,000 runs each
- `npm run test:rules`: 15 emulator tests
- `npx playwright test`: 4 e2e tests in Chrome

Kiro's monthly credits are used up ("You've reached your monthly usage limit"). Kiro authored the steering, the architecture-skeleton spec and code, the frontend, and the scrub-engine spec. Claude Code implemented the rest inside Kiro's stubs; see KIRO_LOG.md and the list below.

**Safal must do these (Claude was told not to touch the account, deploy or set secrets):**
1. Firebase console, project `airlock-app`:
   - Add a **Web app** (none exists yet). Copy its config into `apps/web/.env.local` (gitignored), using `.env.example` for the variable names.
   - Enable **AI Logic** with the **Gemini Developer API**.
   - Enable **App Check** with reCAPTCHA v3: create a site key, put it in `VITE_RECAPTCHA_SITE_KEY`, and set AI Logic to **Enforced**. Run `npm run dev` once, copy the App Check debug token printed in the browser console, and register it in the console (never commit it).
   - Enable **Authentication > Google**, and create **Firestore** (production mode). Optionally create Remote Config parameters matching `REMOTE_CONFIG_DEFAULTS` in `apps/web/src/firebase/remoteConfig.ts`.
2. In Chrome 158, check `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` is Enabled. Open `/chat` and confirm "On-device protection is ready". Then:
   - Send an HR-style message and check the receipt shows `detection: ON_DEVICE` and `answer: IN_CLOUD`.
   - Send a short rewrite and check it answers on the device.
3. Run `/bench` with Nano on, download the JSON, and paste the Rules + Nano row into the README benchmark table.
4. Deploy: `npm run build`, then `firebase deploy --only hosting,firestore:rules` (run by Safal). Add the hosted URL to the README and to the Devpost entry, and tag `firebase-submission`.
5. Record the video (BRIEF §13) and submit before **Dec 1, 3:30 AM IST**.

**Next, if Kiro credits return:** let Kiro restyle the screens Claude had to extend (org editors, receipt diff, bench table, consent toggle). Then run the `copy-editor` and `leak-auditor` agents, and screenshot the secret-guard hook blocking a key, for the Kiroween write-up.

## Claude-authored code (Kiro out of credits, 2026-11-26)
Kiro's free monthly credits ran out after the architecture-skeleton spec, the frontend, and the scrub-engine spec documents. From that point Claude Code implements the remaining logic inside Kiro's stubs, following Kiro's design documents. Each part is logged in KIRO_LOG.md as "implemented with Claude Code":
- [x] scrub-engine: detectors, merge, policy, stand-ins, restore, scrub, secret guard, unit tests + 9 PBT properties
- [x] nano-detector, web pipeline (vault, receipts, router, cloud client, session), org mode, wiring Kiro's pages
- [x] firestore.rules rewrite + 15 emulator tests (REVIEW item 1 done)
- [x] Kiro hooks, agents and mcp.json (REVIEW item 3 done; files written by Claude Code to Kiro's schema)
- [x] CSP (REVIEW item 2): connect-src lists the exact endpoints the installed SDKs call (AI Logic firebasevertexai, App Check, Installations, Remote Config, Firestore, Auth), reCAPTCHA script/frame domains added, fonts self-hosted via @fontsource, no wildcards, no unsafe-eval
- [x] Lint config (REVIEW item 4 done); SETUP_COMPLETE.md removed and the README architecture diagram written (item 5 done)
- [x] Leak benchmark: replaced Kiro's hard-coded demo numbers with a real seeded run
- [x] Copy fixes: removed emoji icons (banned by the design rules) and corrected inaccurate privacy and how-it-works claims
- [x] E2E: 4 Playwright tests (reduced protection, withheld secret, clipboard round trip + receipt, benchmark)
- Design deviation, recorded here: Layer C merges overlapping findings into their union span instead of dropping the loser, and secret categories always win. This came from a shrunk PBT counterexample in which a partly overlapped card number leaked.
