# Setup Complete ✓

The Airlock project is fully initialized and ready for development.

## What's been created

### Project structure
- ✓ Monorepo with npm workspaces
- ✓ Three packages: scrub-engine, nano-detector, web app
- ✓ Firebase configuration (Hosting, Firestore, App Check)
- ✓ Testing infrastructure (Vitest, Playwright, fast-check)
- ✓ Git repository with initial commit

### Kiro configuration (`.kiro/`)
- ✓ **Steering docs**: product, tech, structure, design, privacy-invariants
- ✓ **Directories ready**: specs, hooks, agents, settings
- ✓ All committed to the repository for Kiroween submission

### Key files
- ✓ `LICENSE` - Apache-2.0
- ✓ `README.md` - Project overview
- ✓ `docs/BRIEF.md` - Complete product and technical brief
- ✓ `docs/KIRO_LOG.md` - Development log for hackathon write-up
- ✓ `.gitignore` - Properly excludes secrets and build artifacts
- ✓ `.env.example` - Firebase configuration template
- ✓ `firebase.json` - Security headers configured
- ✓ `firestore.rules` - Security rules with counts-only validation

## Next steps

### 1. Firebase setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and select your project
firebase login
firebase use --add

# Update .firebaserc with your project ID
# Create .env file from .env.example with your Firebase config
```

### 2. Start development
```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 3. Enable Gemini Nano in Chrome
1. Open `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
2. Set to **Enabled**
3. Restart Chrome
4. Visit `chrome://components` and download "Optimization Guide On Device Model"

### 4. Build order (following the brief)

**P0 (by Nov 30 for Firebase hackathon):**
1. Scrub engine (rules, merge, policy, stand-ins, restore)
2. Nano detector (AI Logic wrapper, availability, detection)
3. Hybrid router
4. Encrypted vault
5. Airlock Chat
6. Clipboard airlock
7. Receipts
8. Firebase integration (App Check, Remote Config)
9. Onboarding flow

**P1 (by Dec 4 for Kiroween):**
1. Org mode (Firestore + admin UI)
2. Leak benchmark
3. Settings
4. Legal pages

### 5. Recommended Kiro workflow

1. Create specs in `.kiro/specs/` for each feature before building
2. Use `#brief` in prompts when you need full context
3. Update `docs/KIRO_LOG.md` as you work
4. Set up hooks for automated testing and secret checking

## Available commands

```bash
npm run dev              # Start dev server
npm run build            # Build all packages and app
npm run test             # Run all tests
npm run test:unit        # Unit tests only
npm run test:props       # Property-based tests
npm run test:e2e         # End-to-end tests
npm run preview          # Preview production build
npm run deploy           # Build and deploy to Firebase
```

## Firebase requirements checklist

For the Firebase #BuildHybridAI hackathon:
- ✓ Public GitHub repo
- ✓ Apache-2.0 license in repo (shown in About)
- ✓ Firebase AI Logic ready to import
- ✓ App Check configuration ready
- ✓ Web platform (Chrome + Vite + React)
- ✓ Monorepo structure supports standalone `airlock-gate` package
- □ Import and call Firebase AI Logic at runtime
- □ Enable App Check
- □ Deploy to Firebase Hosting
- □ Create 3-minute video
- □ Tag commit as `firebase-submission`

## Resources

- Brief: `docs/BRIEF.md`
- Steering: `.kiro/steering/`
- Firebase docs: https://firebase.google.com/docs/ai
- Prompt API: `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`

---

Ready to build! Start with creating the first spec in `.kiro/specs/scrub-engine.md`
