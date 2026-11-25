# TODO - Issues to Fix in Upcoming Specs

Based on review findings from REVIEW.md (2026-11-25)

## 1. org-mode spec (P1) - Firestore Rules Security Bugs

**Priority**: HIGH - Security critical

### Issues:
1. **Create vs update handling**: Writing to a day's stats doc for the first time is denied because on create, `resource` is null, so `diff(resource.data)` fails.
   - **Fix**: Handle create and update separately in rules

2. **Value type validation missing**: `counts` and `routes` values aren't checked to be numbers, and increments aren't enforced.
   - **Fix**: Check `is int` and that each new value is at least the old value

3. **CRITICAL: Invite code bypass**: Any signed-in user can add themselves as a member of any org without the invite code.
   - **Fix**: Joining must require the invite code (hash it in the client, compare to `inviteCodeHash`) OR route the join through a callable function

4. **Atomicity issue**: Creating an org doesn't make the creator an admin atomically.
   - **Fix**: Use a batch write with a rule that allows exactly that operation

### Action items:
- [ ] Rewrite Firestore rules with proper create/update separation
- [ ] Add numeric validation and increment enforcement
- [ ] Implement invite code verification (client hashing or Cloud Function)
- [ ] Add batch write support for atomic org creation
- [ ] Write comprehensive emulator tests (BRIEF section 11.4):
  - Members can only increment stats
  - No content fields allowed in stats
  - Invite code required to join
  - Only org creator becomes admin on creation
  - Numeric fields are properly validated

---

## 2. firebase-platform spec (P0) - CSP Headers

**Priority**: MEDIUM - Required for production but not blocking development

### Issues:
1. **App Check reCAPTCHA v3 blocked**: Current CSP doesn't allow Google domains needed for reCAPTCHA
   - **Fix**: Add to CSP:
     - `script-src https://www.google.com https://www.gstatic.com`
     - `frame-src https://www.google.com https://recaptcha.google.com`

2. **Font loading**: Design requires Baloo 2, Nunito, Caveat fonts
   - **Fix**: Self-host fonts so `font-src 'self'` stays strict (don't use Google Fonts CDN)

3. **Connect-src too broad**: Need to verify exact AI Logic and App Check endpoints
   - **Fix**: Replace wildcards with specific endpoints:
     - Firebase: `firebaseinstallations.googleapis.com`, `firebaseremoteconfig.googleapis.com`
     - AI Logic: specific endpoint
     - App Check: specific endpoint
   - **Action**: Check Firebase AI Logic docs for exact endpoint

### Action items:
- [ ] Download and self-host fonts (Baloo 2, Nunito, Caveat)
- [ ] Update CSP in firebase.json with Google/reCAPTCHA domains
- [ ] Research exact Firebase AI Logic endpoint
- [ ] Replace `connect-src` wildcards with specific domains
- [ ] Test CSP with browser console (should have no violations)

---

## 3. Kiro Configuration (P1) - Hooks, Agents, MCP

**Priority**: MEDIUM - Judged for Kiroween but not blocking core features

These are playbook steps A4 to A6 from BRIEF section 12.

### Hooks to create (`.kiro/hooks/`):
- [ ] **secret-guard**: Pre-submit prompt checking
  - Runs `node packages/scrub-engine/bin/check-prompt.mjs`
  - Reads `USER_PROMPT` from environment
  - Exits with code 2 if credential or ID found
  - Dogfooding: Airlock's own detector stops you from pasting secrets into Kiro

- [ ] **test-on-save**: File save trigger
  - Matcher: `packages/.*\.ts$`
  - Runs: `npx vitest related --run`

- [ ] **props-after-task**: Post task execution
  - Runs: `npm run test:props -w packages/scrub-engine`

- [ ] **privacy-review-on-stop**: Agent stop, type agent
  - Prompt: "Review the diff for any code path that could send raw text, findings or mappings to the network, console or storage other than the vault. Report file:line."

- [ ] **docs-sync**: Manual trigger
  - Updates README sections from specs

### Custom agents (`.kiro/agents/`):
- [ ] **leak-auditor**: 
  - Read-only tools
  - Loads `privacy-invariants.md`
  - Hunts for egress paths and invariant violations

- [ ] **copy-editor**:
  - Checks UI copy against voice rules
  - No em dashes, sentence case, warm tone

### MCP servers (`.kiro/settings/mcp.json`):
- [ ] **Firebase MCP**: Project, App Check, Remote Config, rules setup
- [ ] **Playwright MCP**: Let Kiro drive Chrome to check flows
- [ ] **GitHub MCP**: Issues and PRs

### Action items:
- [ ] Create all 5 hooks with proper trigger configs
- [ ] Create 2 custom agents with appropriate prompts
- [ ] Configure 3 MCP servers
- [ ] Test each hook fires correctly
- [ ] Document in KIRO_LOG.md

---

## 4. Lint Configuration (P0) - Already Fixed ✓

**Status**: COMPLETE

- [x] Created `eslint.config.js` with flat config
- [x] Added typescript-eslint, react-hooks, react-refresh plugins
- [x] Created `.prettierrc` with project style
- [x] Updated package.json with working lint script

---

## 5. Pre-Submission Polish (Before Nov 30)

**Priority**: LOW - Final cleanup before Firebase submission

### Action items:
- [ ] Delete `SETUP_COMPLETE.md` (scaffolding note)
- [ ] Create architecture diagram (replace "Architecture diagram coming soon" in README)
- [ ] Verify "Built with Kiro; reviewed with Claude Code" in README
- [ ] Tag commit as `firebase-submission`
- [ ] Record 3-minute demo video
- [ ] Write submission description

---

## Notes

- Items marked CRITICAL should be fixed before any org mode testing
- CSP issues won't block local development but are required for Firebase Hosting
- Kiro configuration is judged for Kiroween (Dec 4) but not Firebase (Nov 30)
- All Firestore rules must have emulator tests (BRIEF section 11.4)

**Review checkpoint**: Before starting org-mode spec, revisit item 1 and ensure all security issues are addressed in the spec itself.
