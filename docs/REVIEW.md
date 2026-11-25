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
