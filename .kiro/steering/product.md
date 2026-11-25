---
inclusion: always
---
---
loadMode: always
---

# Product Steering

## What Airlock is

**Use any cloud AI without leaking secrets.**

A private model on your device (Gemini Nano in Chrome, via Firebase AI Logic hybrid inference) finds sensitive details and swaps them for realistic stand-ins before anything leaves. Only the cleaned text reaches the cloud model, and the answer is restored with your real details, locally.

Tagline: *"Your secrets stay on this side of the door."*

## The problem we solve

1. People paste confidential material into cloud chatbots daily: client names, salaries, medical details, source code with API keys, students' personal data, internal project names.
2. Companies either ban AI tools (losing productivity, driving shadow AI) or buy cloud DLP tools that require sending secrets to yet another vendor.
3. Redaction tools that use `[REDACTED]` destroy the cloud model's ability to reason effectively.

## The insight

- **On-device model = trust boundary**: Detection, classification, pseudonymization and restoration all happen on the device. No server ever sees raw sensitive values.
- **Cloud model = capability**: Heavy reasoning runs on cleaned text that reads naturally with realistic, consistent stand-ins.
- **Hybrid router**: Decides per-request whether to answer locally, send scrubbed text to cloud, or block.
- **Graceful degradation**: Falls back to deterministic rules if no on-device model is available, with reduced protection clearly indicated and consent required.

## Target users

- Office workers (HR, sensitive emails)
- Professionals (lawyers, doctors, accountants)
- Developers (debugging with keys in logs)
- Students and NGO staff
- Org admins (policy setting, compliance)

## Priority levels

- **P0**: Ships by Nov 30 for Firebase hackathon
- **P1**: Ships by Dec 4 for Kiroween
- **P2**: Stretch goals

## Core features (P0)

1. Scrub engine with layered detection (rules + Nano)
2. Realistic, consistent stand-ins (names stay names, emails stay emails)
3. Restore with case handling, possessives, aliases
4. Encrypted local vault (non-extractable keys)
5. Hybrid router (local answer, cloud scrubbed, or block)
6. Airlock Chat with live redaction preview and multi-turn
7. Receipt showing exactly what left the device
8. Clipboard airlock (works with any AI tool)
9. Protection status and onboarding
10. Firebase wiring (App Check, Remote Config, Auth, Hosting)

## Org mode (P1)

- Admin sets protected terms and category policies
- Members' clients pull policy and apply on-device
- Stats are counts only, never content
- Dashboard shows aggregate metrics

## Honesty commitment

Built with Kiro. Reviewed with Claude Code. This attribution appears in README and all submissions.
