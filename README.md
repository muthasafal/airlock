# Airlock

**Your secrets stay on this side of the door.**

Use any cloud AI without leaking secrets. A private model on your device (Gemini Nano in Chrome, via Firebase AI Logic hybrid inference) finds sensitive details and swaps them for realistic stand-ins before anything leaves. Only the cleaned text reaches the cloud model, and the answer is restored with your real details, locally.

## Built with

- **Kiro** – AI development environment
- **Firebase AI Logic** – Hybrid inference with Gemini Nano on-device
- **Gemini Nano** – On-device detection and classification
- **Gemini Cloud** – Cloud reasoning on scrubbed text

Reviewed with Claude Code.

## Quick start

### Prerequisites

- **Chrome Desktop 139+** with the Prompt API flag enabled
- Node.js 18+
- Firebase project with AI Logic enabled

### Enable Gemini Nano

1. Open `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
2. Set to **Enabled**
3. Restart Chrome
4. Visit `chrome://components` and ensure "Optimization Guide On Device Model" is downloaded

### Setup

```bash
npm install
npm run dev
```

The app will open at `http://localhost:5173`.

## How it works

1. **Detect** – On-device rules and Gemini Nano find sensitive information
2. **Pseudonymize** – Realistic stand-ins replace your secrets (names stay names, emails stay emails)
3. **Send** – Only the cleaned text reaches the cloud
4. **Restore** – The answer comes back with your real details, all on your device

[Architecture diagram coming soon]

## Privacy guarantees

- No server, including ours, ever sees raw sensitive values
- Session mappings are encrypted with a non-extractable key in IndexedDB
- No content in analytics, logs, or Firestore
- Firestore rules enforce counts-only stats (no strings allowed)

## License

Apache-2.0

---

*Built for Firebase #BuildHybridAI, Kiroween 2026, and Slay Hacks*
