# Design Document: integrations

**Authored by:** Claude Code (Kiro credits exhausted). See requirements.md.

## Overview

One engine and many doors. Every integration reuses `@airlock/scrub-engine` unchanged, so the nine correctness properties (BRIEF §8.6) hold everywhere. What changes per host is where cleaning happens and where restored text is allowed to appear.

| Host | Where cleaning runs | Detection | Where restored text appears |
|---|---|---|---|
| Airlock web app | the page | rules + Gemini Nano (AI Logic) | the chat, locally |
| Chrome extension on ChatGPT, Claude.ai, Gemini, Copilot, Perplexity, DeepSeek | content script, before the page sees the paste | rules + Gemini Nano (Prompt API) when available | the extension side panel only |
| Terminal, any tool | `airlock` CLI | rules (+ optional local model via Ollama on 127.0.0.1) | stdout or a file the user chose |
| Claude Code, Codex, Cursor, Gemini CLI, Claude Desktop | `airlock mcp` (stdio) | as the CLI | a local file only; tool results never contain originals |

## Packages

```
packages/cli/                 @airlock/cli  (bin: airlock)
  src/vault.ts                encrypted session store (~/.airlock, AES-256-GCM, 0600 key)
  src/engine.ts               clean / restore / check on top of scrub-engine
  src/local-model.ts          optional Ollama detector (loopback only, BRIEF §8.1 schema)
  src/mcp.ts                  MCP server: read_clean, clean_text, restore_to_file, check, forget
  src/cli.ts                  argument parsing and commands, including `hook claude-code`
  test/                       vault, engine, MCP path guard, hook
apps/extension/               Chrome MV3 extension
  manifest.json               content scripts on the listed AI sites, side panel, context menus
  src/content.ts              paste interception, cleaning, notice with Undo
  src/background.ts           context menus, side panel, session store (chrome.storage.session)
  src/sidepanel.html/.ts      restored answer view
  src/popup.html/.ts          per-site toggle, forget
  build.mjs                   esbuild bundle (scrub-engine is bundled in, no remote code)
integrations/
  skill/airlock/SKILL.md      the Agent Skill (Claude apps, Claude Code, Codex)
  claude-code/                plugin: .claude-plugin/plugin.json, skills/, hooks/hooks.json, .mcp.json
  codex/                      config.toml snippet, AGENTS.md snippet, skill install note
  cursor/mcp.json, gemini-cli/settings.json
  README.md                   install guide for every host
```

## Key decisions

1. **Originals never go back into a model's context.** The MCP tool `airlock_restore_to_file` returns metadata only. The skill tells agents never to print restored text. The extension restores in its own side panel, not in the website's DOM, because the site's JavaScript can read anything placed in its page.
2. **Paste interception, not DOM rewriting.** The content script listens for `paste` in the capture phase on `window` (registered at `document_start`, so it runs before the page's listeners), calls `preventDefault` and `stopImmediatePropagation`, then inserts the cleaned text with `document.execCommand('insertText')`. This works in textareas and in the contenteditable editors these sites use (ProseMirror, Lexical, Quill).
3. **Session = mapping scope.** CLI and MCP share named sessions on disk, so `airlock scrub` and `airlock restore` (or the MCP tools) agree. The extension keeps one session per browser session, in memory only.
4. **Local model is opt-in and loopback-only.** Node has no Gemini Nano. Names need a model, so the CLI can use a local Ollama model, and it refuses any non-loopback URL so text never leaves the machine.
5. **Same secret guard everywhere.** The Kiro `promptSubmit` hook, the Claude Code `UserPromptSubmit` hook and `airlock check` all use the scrub engine's rule detectors and the same blocking categories.

## Correctness properties

- **P10, no originals in tool results:** for any input, the result of `airlock_restore_to_file` contains none of the session's original values.
- **P11, vault round trip:** a session saved and loaded from disk restores exactly what it scrubbed (property P2 holds through the vault).
- **P12, guard blocks secrets:** for any prompt containing a planted blocking secret, the hook exits 2 and its message contains no secret value.
- **P13, path guard:** `airlock_restore_to_file` refuses paths outside the working directory and home.
