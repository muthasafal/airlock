---
inclusion: always
---

# Project Structure

## Monorepo layout (npm workspaces)

```
airlock/
  .kiro/                     # Kiro configuration (committed)
    steering/                # Always-on context
    specs/                   # Feature specifications
    hooks/                   # Event-triggered automation
    agents/                  # Custom agents
    settings/mcp.json        # MCP server configuration
  
  docs/
    BRIEF.md                 # Source of truth
    KIRO_LOG.md              # Development log for Kiroween
  
  packages/
    scrub-engine/            # Pure TS core logic
      src/
        detectors/           # Rule-based detectors
        merge.ts             # Finding deduplication
        policy.ts            # Action resolution
        stand-ins.ts         # Pseudonym generation
        restore.ts           # Reverse mapping
        types.ts             # Shared types
      test/                  # Vitest + fast-check
        unit/
        properties/          # PBT invariants
      package.json
      tsconfig.json
      vitest.config.ts
    
    nano-detector/           # Firebase AI Logic wrapper
      src/
        availability.ts      # Device capability checking
        init.ts              # Model initialization
        detection.ts         # Structured NER
        classification.ts    # Task classification
        chunking.ts          # Text splitting with overlap
      test/
      package.json
      tsconfig.json
  
  apps/
    web/                     # Vite + React app
      src/
        features/
          chat/              # Airlock Chat
          clipboard/         # Clipboard airlock
          receipts/          # Receipt viewer
          org/               # Org mode
          bench/             # Leak benchmark
          settings/          # User settings
          onboarding/        # First-run flow
        firebase/
          init.ts
          appCheck.ts
          remoteConfig.ts
          auth.ts
          firestore.ts
        ui/
          components/        # Design system
          AirlockChamber/    # Signature animation
          tokens.css         # Design tokens
        lib/
          vault.ts           # Encrypted IndexedDB
          router.ts          # Hybrid routing logic
        App.tsx
        main.tsx
      public/
      index.html
      package.json
      tsconfig.json
      vite.config.ts
  
  firebase.json              # Hosting, security headers
  firestore.rules            # Security rules
  firestore.indexes.json
  .firebaserc
  package.json               # Workspace root
  tsconfig.json
  vitest.config.ts
  playwright.config.ts
  .gitignore
  LICENSE
  README.md
```

## Package boundaries

- **scrub-engine**: Pure functions, no DOM or React, deterministic given seed and detector outputs
- **nano-detector**: Firebase AI Logic only, exports availability checks and model wrappers
- **web**: UI, routing, Firebase wiring, vault, assembles packages

## Import rules

- Packages never import from apps
- Packages may import from other packages
- Web imports from both packages
- scrub-engine has zero external runtime dependencies (dev dependencies OK)
