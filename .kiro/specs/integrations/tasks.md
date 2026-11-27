# Implementation Plan: integrations

Authored and implemented by Claude Code while Kiro had no credits. Tasks marked "(for Kiro)" are left for Kiro after credits reset on 2026-12-01.

- [x] 1. CLI package `packages/cli`
  - [x] 1.1 Encrypted session vault (`src/vault.ts`) with TTL, forget and forget-all (R1.6 to R1.8)
  - [x] 1.2 Engine: clean, restore, check with blocking categories (R1.1 to R1.4)
  - [x] 1.3 Optional loopback-only Ollama detector with the BRIEF §8.1 schema (R2)
  - [x] 1.4 Commands `scrub`, `restore`, `check`, `forget`, `hook claude-code`, `mcp` (R1, R5.2)
  - [x] 1.5 Tests: vault round trip (P11), guard (P12), path guard (P13), no originals in restore_to_file results (P10)
- [x] 2. MCP server `airlock mcp` with five tools (R3)
- [x] 3. Agent skill `integrations/skill/airlock/SKILL.md` (R4)
- [x] 4. Claude Code plugin with skill, MCP config and UserPromptSubmit hook (R5)
- [x] 5. Codex, Cursor and Gemini CLI configuration (R6)
- [x] 6. Chrome extension `apps/extension` (R7)
  - [x] 6.1 Manifest, content script paste interception with notice and Undo
  - [x] 6.2 Gemini Nano via the Prompt API when available, rules otherwise
  - [x] 6.3 Context menu "Restore with Airlock" into the side panel
  - [x] 6.4 Popup: per-site toggle, forget
- [x] 7. Install guide `integrations/README.md`, README section, KIRO_LOG entry
- [ ] 8. (for Kiro) Run the `leak-auditor` agent over `packages/cli` and `apps/extension`, and fix its findings
- [ ] 9. (for Kiro) Run the `copy-editor` agent over the extension's popup, notice and side-panel copy
- [ ] 10. (for Kiro) Add a `fileEdited` hook: when `packages/cli/src/**` changes, run `npm test -w packages/cli`
