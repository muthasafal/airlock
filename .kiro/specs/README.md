# Specifications

This directory will contain feature specifications created during development.

Each spec should follow this structure:

```markdown
# Feature Name

## Overview
Brief description of what this feature does

## Requirements
EARS-style requirements:
- WHEN [trigger] IF [condition] THEN [system response]
- WHERE [location/context] the system SHALL [requirement]

## Acceptance Criteria
Testable conditions that define done

## Dependencies
Other specs or packages this depends on

## Testing Strategy
How this will be tested (unit, integration, PBT, E2E)

## Implementation Notes
Key design decisions and constraints
```

## Recommended build order

Following the brief section 12:

1. `scrub-engine.md` - Rules, merge, policy, stand-ins, restore (with PBT)
2. `nano-detector.md` - AI Logic wrapper, availability, detection, chunking
3. `hybrid-router.md` - Decision logic and receipts
4. `vault.md` - Encrypted IndexedDB
5. `airlock-chat.md` - UI, streaming, chamber animation
6. `clipboard-airlock.md`
7. `firebase-platform.md` - App Check, Remote Config, Hosting
8. `org-mode.md` - Firestore schema, rules, admin UI
9. `leak-benchmark.md`
10. (P2) `screenshot-airlock.md`, `chrome-extension.md`

Create each spec before starting implementation to get the most value from Kiro's spec-driven workflow.
