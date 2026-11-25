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

## Resume here (2026-11-25, paused)

**State.** Steering and setup only. No specs, hooks, agents or MCP yet, and no real features. `npm run build` passes. `npm run lint` fails with 256 errors (probably because it lints the built `dist/` folders; fix in the skeleton spec). Each steering file has a duplicate second front-matter block (`loadMode: ...`); keep only the `inclusion:` block. Kiro's chat in the airlock window is set to **Supervised**, Claude Sonnet 4.5. In the Kiro editor, `docs/REVIEW.md` had unsaved edits that never reached disk. Discard them, or check them before saving.

**Blocker: Kiro credits.** The status bar showed "Kiro Free 17.63 / 50", and that pool is shared with Here Lies. The full plan (skeleton, tooling, then 6 specs with PBT) needs well over 100 credits. Safal has to choose: (a) upgrade Kiro and run the full plan, or (b) a ~20-credit budget for Airlock (skeleton, scrub-engine and tooling files), with the rest written by Claude Code and logged honestly. Send no Kiro prompts until that's decided.

**Next Kiro prompt (new Feature spec, name `architecture-skeleton`):**
```
Spec name: architecture-skeleton. Source: #brief (docs/BRIEF.md, all sections; never edit or shorten it) plus docs/REVIEW.md.

Goal: create EVERY planned file of the app as a wired, type-correct skeleton before any feature logic. Bodies are stubs (throw new Error("not implemented: <spec>") or return typed placeholders), but every file gets its real exported types, interfaces and signatures, and a doc comment per function describing the logic it will implement (cite the BRIEF section).

Cover:
- packages/scrub-engine: types, rule detectors (one per 8.1 category), Verhoeff/Luhn/entropy helpers, merge (Layer C), policy + resolution order (8.3), stand-in generator + pools (8.2), restore + streaming buffer (8.5), Detector interface for Layer B, vault interface, bin/check-prompt.mjs entry.
- packages/nano-detector: availability, user-gesture init with progress, structured detection (exact 8.1 JSON schema, zod), span resolution, chunking, task classification (8.4). Check option names against the installed firebase/ai typings (InferenceMode, onDeviceParams, inCloudParams, inferenceSource, initializeDeviceModel).
- apps/web: src/firebase (init, appCheck, remoteConfig with every 9.3 key and default, auth, firestore), hybrid router (8.4 decision table), vault (IndexedDB + AES-GCM non-extractable key, TTL, forget), receipts store, and the full React component tree with props for every route in 10.1, including AirlockChamber. Presentational components hold no logic; logic lives in hooks/services.
- firestore.rules + data model types for 9.2 (fold in REVIEW.md item 1), firebase.json CSP (item 2).
- Fix lint (ignore dist/, build output, *.tsbuildinfo; add *.tsbuildinfo to .gitignore) and remove the duplicate loadMode front-matter blocks in .kiro/steering.

Done when: every BRIEF feature has a home and nothing is orphaned; npm run typecheck, npm run lint and npm run build all pass; tests pass with no tests yet. Write requirements (EARS) first; I will review before design.
```
After that: tooling (A4–A6 in `_planning/kiro-kickoff.md`), then specs scrub-engine, nano-detector, hybrid-router, vault, firebase-platform, airlock-chat.

## Claude-authored code (Kiro out of credits, 2026-11-26)
Kiro's free monthly credits ran out after the architecture-skeleton spec, the frontend, and the scrub-engine spec documents. From that point Claude Code implements the remaining logic inside Kiro's stubs, following Kiro's design documents. Each part is logged in KIRO_LOG.md as "implemented with Claude Code":
- [x] scrub-engine: detectors, merge, policy, stand-ins, restore, scrub, secret guard, unit tests + 9 PBT properties
- Design deviation, recorded here: Layer C merges overlapping findings into their union span instead of dropping the loser, and secret categories always win. This came from a shrunk PBT counterexample in which a partly overlapped card number leaked.
