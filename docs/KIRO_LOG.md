# Kiro Usage Log

This document tracks how Kiro was used throughout the Airlock project for the Kiroween 2026 submission.

## 2026-11-25 - Complete Project Setup

**What I asked:** "Follow this brief I made and set everything up"

**What Kiro did:**

### 1. Repository structure
- Created npm workspaces monorepo with three packages:
  - `packages/scrub-engine`: Pure TypeScript core (no DOM/React)
  - `packages/nano-detector`: Firebase AI Logic wrapper
  - `apps/web`: Vite + React 19 app
- Set up complete directory structure with feature folders ready
- Initialized git repository with proper `.gitignore` (excludes secrets, debug tokens, build artifacts)

### 2. Kiro configuration (`.kiro/`)
Created all steering documents:
- `product.md`: Product vision, problem statement, priorities
- `tech.md`: Stack, Firebase AI Logic platform constraints, commands
- `structure.md`: Monorepo layout and package boundaries
- `design.md`: Design language (rounded/warm, motion, accessibility)
- `privacy-invariants.md`: 19 MUST requirements that become PBT tests
- `brief.md`: Reference to full BRIEF.md (use `#brief` to load)

Created directory structure for specs, hooks, agents, and MCP settings.

### 3. Firebase configuration
- `firebase.json` with strict security headers (CSP, X-Frame-Options, etc.)
- `firestore.rules` with counts-only validation for org stats
- `firestore.indexes.json`
- `.firebaserc` template
- `.env.example` with Firebase config template

### 4. Testing infrastructure
- Vitest for unit tests (separate config for properties)
- Playwright for E2E (Chrome channel for Nano)
- fast-check ready for property-based testing
- Test directories created for each package

### 5. Package configuration
Each package has:
- `package.json` with correct dependencies
- `tsconfig.json` with proper compiler options
- `vitest.config.ts`
- Build scripts configured

### 6. Type system foundation
Created `packages/scrub-engine/src/types.ts` with:
- 23 category types (EMAIL, PHONE, PERSON, etc.)
- Core interfaces: Finding, Policy, SessionMapping, ScrubResult, RestoreResult
- Action enum: PSEUDONYMIZE, GENERALIZE, BLOCK, KEEP
- Zero external dependencies (pure TypeScript)

### 7. Web app starter
- React 19 with TypeScript
- Basic `App.tsx` and `main.tsx`
- `index.css` with design foundations and reduced-motion support
- Route structure ready for all features

### 8. Documentation
- `LICENSE`: Apache-2.0 (Copyright 2026 Safal Mutha)
- `README.md`: Project overview, quick start, privacy guarantees
- `SETUP_COMPLETE.md`: Next steps and build order
- `.kiro/specs/README.md`: Spec template and recommended order
- This log file

### 9. Git commits
Initial commits with complete structure.

**What changed:**
- Complete project from zero to ready-to-build
- 335+ npm packages installed
- Full `.kiro/` directory structure committed
- All steering docs aligned with the 15-page brief
- Ready for P0 feature development

**Key decisions:**
- Used npm workspaces (not pnpm or yarn) per brief
- Separated concerns: pure logic in scrub-engine, Firebase in nano-detector, UI in web
- Security-first: CSP headers, Firestore rules, secrets excluded
- Test infrastructure includes PBT from day one
- Design language encoded in steering (warm, rounded, motion with reduced-motion support)

---

## 2026-11-25 - Review Fixes and Quality Improvements

**What I asked:** "Check this file [REVIEW.md], found some issues, either solve them now if possible or store them in wherever you store todos for a later stage"

**What Kiro did:**

### Immediate fixes applied:
1. **YAML front matter added to all steering docs**
   - Prevents loading full brief on every request (saves credits)
   - `brief.md`: loadMode manual (only with `#brief`)
   - `design.md`: fileMatch for `apps/web/src/**/*.{tsx,css}`
   - Others: loadMode always
   
2. **Build errors fixed**
   - Created `nano-detector/src/index.ts` placeholder (tsc now succeeds)
   - Added `apps/web/src/vite-env.d.ts` for Vite types
   - Commented out non-existent exports in scrub-engine until spec creates them

3. **Lint configuration complete**
   - Created `eslint.config.js` with flat config
   - Added typescript-eslint, react-hooks, react-refresh plugins
   - Created `.prettierrc` with project style
   - `npm run lint` now works

4. **Test scripts hardened**
   - Added `--passWithNoTests` to prevent failures before tests exist
   - Added `typecheck` script using `tsc -b`

5. **Documentation polish**
   - Restored architecture diagram placeholder in README
   - Dates corrected to 2026 throughout

### Issues documented for later (`.kiro/TODO.md`):
1. **Firestore rules security bugs** (CRITICAL - for org-mode spec):
   - Create vs update handling broken
   - No numeric validation on stats
   - Invite code bypass vulnerability
   - Atomicity issue on org creation
   - Needs comprehensive emulator tests

2. **CSP headers** (for firebase-platform spec):
   - App Check reCAPTCHA needs Google domains
   - Self-host fonts to keep strict font-src
   - Replace connect-src wildcards with exact endpoints

3. **Kiro configuration** (for P1, judged in Kiroween):
   - 5 hooks to create (secret-guard, test-on-save, etc.)
   - 2 custom agents (leak-auditor, copy-editor)
   - 3 MCP servers (Firebase, Playwright, GitHub)

4. **Pre-submission polish**:
   - Delete SETUP_COMPLETE.md
   - Create architecture diagram

**What changed:**
- TypeScript now compiles cleanly (`npm run typecheck` passes)
- Linting infrastructure complete
- All review findings either fixed or tracked
- Steering docs optimized for token efficiency
- TODO.md provides clear roadmap for security fixes

**Next step:** Start building P0 features with first spec (scrub-engine.md)

---

(Log continues as features are built)
