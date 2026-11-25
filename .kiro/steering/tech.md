---
inclusion: always
---
# Technical Steering

## Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Custom components following design language (no heavy UI kits)
- **Animation**: Framer Motion (or motion)
- **Routing**: React Router
- **Backend**: Firebase (AI Logic, App Check, Auth, Firestore, Remote Config, Hosting)
- **Storage**: IndexedDB (via idb) for encrypted vault
- **Testing**: Vitest, fast-check (PBT), Playwright
- **Build**: npm workspaces monorepo

## Platform constraints (Firebase AI Logic, Nov 2026)

### On-device (Chrome 139+ with Gemini Nano)

- **Supported**: Single-turn text, text + image (JPEG/PNG inline), streaming, structured output (JSON schema)
- **Limits**: ~9,216 tokens per request (~20,000 characters with headroom)
- **NOT supported**: Multi-turn chat, tools/function calling, audio, video, PDF
- **Availability**: Check via `LanguageModel.availability()` → `"available" | "downloadable" | "downloading" | "unavailable"`
- **Initialization**: `model.initializeDeviceModel()` requires user gesture to trigger download

### SDK (firebase v13+)

```typescript
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE });
// result.response.inferenceSource === "ON_DEVICE" | "IN_CLOUD"
```

**Modes**: `PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, `PREFER_IN_CLOUD`, `ONLY_IN_CLOUD`

### Cloud models

- `gemini-3.5-flash-lite`: Default for Web hybrid
- `gemini-3.8-flash`: For harder reasoning/code tasks
- **Keep model names in Remote Config**

### App Check

- Dev: Debug token (`self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` before init)
- Prod: `ReCaptchaV3Provider`
- Never commit debug tokens

### Browser requirements

- Chrome Desktop 139+
- Flag: `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → Enabled
- Verified on RTX 5060 with 8GB VRAM

## Commands

```bash
# Development
npm install
npm run dev              # Start web app
npm run build            # Build all packages and app
npm run test             # Run all tests
npm run test:unit        # Vitest unit tests
npm run test:props       # Property-based tests
npm run test:e2e         # Playwright E2E tests

# Deployment
npm run deploy           # Build and deploy to Firebase Hosting
```

## Libraries

- `firebase` (v13+)
- `react`, `react-dom`, `react-router`
- `framer-motion` (or `motion`)
- `idb` (IndexedDB wrapper)
- `zod` (model output validation)
- `fast-check` (property-based testing)
- `vitest`, `@playwright/test`
- `tesseract.js` (P2, lazy-loaded)

Avoid heavy UI component libraries. Build components in-house to match the design language.

## Security requirements

- No secrets in repo (Firebase config is public by design, protected by App Check)
- Strict CSP in `firebase.json` hosting headers
- No logging of raw text, mappings, or findings in production
- Validate all model JSON output with zod
- Source maps off in production
- Dependencies audited regularly
