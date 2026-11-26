# Requirements Document

## Introduction

**Feature Name:** Integrations (Airlock everywhere)
**Feature ID:** integrations
**Authored by:** Claude Code (Kiro's monthly credits were used up on 2026-11-26). Written in Kiro's spec format so Kiro can review it and run follow-up tasks once credits reset.
**Source:** BRIEF.md §1 to §3 (the trust boundary), §7 P0-8 (clipboard airlock), P2-2 (Chrome extension), §8 (scrub engine), §11.3 (security), §12 (secret guard).

People don't only use AI in Airlock's own chat. They use ChatGPT, Claude, Gemini and Copilot in the browser, and coding agents (Claude Code, Codex, Cursor, Gemini CLI) on their laptops. This feature brings the same promise to all of them: **sensitive details are found and swapped on the user's device before any AI sees them, and restored locally afterwards.**

Principle that shapes every requirement: an integration must never hand the original values to a cloud model, including through a tool result. Restored text is only ever shown to the user (side panel, terminal, a local file), never returned into the AI's context.

## Glossary
- **Host:** the AI product the user is working in (ChatGPT, Claude.ai, Claude Code, Codex, ...).
- **Session:** one named mapping of originals to stand-ins, encrypted at rest, shared by commands that use the same session name.
- **Clean:** run the scrub engine (rules, plus a local model when available) and return text with stand-ins and `‹secret-N›` placeholders.

## Requirements

### R1: Command-line tool
**User story:** As a developer, I want `airlock` in my terminal, so I can clean any text or file before it goes into any AI tool.
1. WHEN the user runs `airlock scrub [file]` THEN the CLI SHALL print the cleaned text to stdout and a one-line summary (counts by category, never values) to stderr.
2. WHEN no file is given THEN the CLI SHALL read stdin.
3. WHEN the user runs `airlock restore [file]` THEN the CLI SHALL print the text with this session's stand-ins replaced by the originals.
4. WHEN the user runs `airlock check [file]` AND a blocking secret (API key, JWT, private key, password, Aadhaar, PAN, card) is present THEN the CLI SHALL exit with code 2 and name the kinds found, never the values.
5. WHEN `--session <name>` is given THEN the CLI SHALL use that session's mapping; otherwise the session `default`.
6. WHEN the user runs `airlock forget [--all]` THEN the CLI SHALL delete that session (or every session) from disk.
7. The CLI SHALL store each session encrypted with AES-256-GCM under a random 256-bit key kept in the user's Airlock home directory (`~/.airlock`, or `AIRLOCK_HOME`), file mode 0600 where the OS supports it.
8. The CLI SHALL expire sessions after 24 hours by default (`--ttl-hours`).
9. The CLI SHALL make no network calls, except to a local model server on `127.0.0.1` when the user opts in (R2).

### R2: Optional local model for names and context
1. WHEN the user passes `--local-model ollama:<model>` (or sets `AIRLOCK_LOCAL_MODEL`) THEN the CLI SHALL ask that model, through Ollama's API on 127.0.0.1 only, for PERSON, ORG, LOCATION, HEALTH, FINANCIAL_AMOUNT, LEGAL_MATTER, INTERNAL_PROJECT, CREDENTIAL, GOVERNMENT_ID, DATE_OF_BIRTH and OTHER_SENSITIVE spans, using the BRIEF §8.1 JSON schema.
2. IF the local model is unreachable, times out or returns invalid JSON THEN the CLI SHALL continue with rules only and say "rules only" in the summary.
3. The CLI SHALL refuse a local-model URL whose host is not loopback.

### R3: MCP server
**User story:** As a user of Claude Desktop, Claude Code, Codex, Cursor or Gemini CLI, I want my agent to handle sensitive files without the originals ever entering the model's context.
1. WHEN started with `airlock mcp` THEN the server SHALL speak MCP over stdio.
2. The server SHALL provide `airlock_read_clean(path, session?)`: it reads a local file and returns only the cleaned text plus counts.
3. The server SHALL provide `airlock_clean_text(text, session?)`: it returns the cleaned text plus counts.
4. The server SHALL provide `airlock_restore_to_file(text, output_path, session?)`: it writes the restored text to a local file and returns only the path, the number of values restored and the character count, never the restored text.
5. The server SHALL provide `airlock_check(text)`: it returns kinds and counts, never values.
6. The server SHALL provide `airlock_forget(session)`.
7. IF `output_path` resolves outside the current working directory or the user's home THEN the server SHALL refuse.

### R4: Agent skill
1. The skill SHALL tell the agent when to use Airlock: whenever the user shares or points to client data, personal data, credentials, contracts, medical or HR material, or asks to post content outside the machine.
2. The skill SHALL tell the agent to read sensitive files with `airlock_read_clean` (or `airlock scrub`) instead of reading them raw.
3. The skill SHALL tell the agent to write final documents with real details through `airlock_restore_to_file` (or `airlock restore > file`), and never to repeat restored values in chat.
4. The skill SHALL tell the agent that placeholders like `‹secret-1›` must never be guessed or reconstructed.
5. The skill SHALL work as a standard Agent Skill (`SKILL.md` with name and description front matter) for Claude apps, Claude Code and Codex.

### R5: Claude Code plugin
1. The plugin SHALL bundle the skill, the MCP server configuration and a `UserPromptSubmit` hook.
2. WHEN a user submits a prompt containing a blocking secret THEN the hook SHALL block it (exit code 2) with a short message that names the kind of secret and never echoes the value.

### R6: Codex, Cursor and Gemini CLI setup
1. The repo SHALL ship copy-paste configuration for Codex (`~/.codex/config.toml`, plus an `AGENTS.md` snippet), Cursor (`.cursor/mcp.json`) and Gemini CLI (`settings.json`).

### R7: Chrome extension (web chat integration)
**User story:** As someone who uses ChatGPT, Claude.ai, Gemini or Copilot in Chrome, I want what I paste to be cleaned before the site sees it, and the answers restored where only I can see them.
1. The extension SHALL run on chatgpt.com, chat.openai.com, claude.ai, gemini.google.com, copilot.microsoft.com, perplexity.ai and chat.deepseek.com, and nowhere else.
2. WHEN the user pastes into the page's message box AND Airlock is on for that site THEN the extension SHALL stop the page from receiving the raw paste, clean the text and insert the cleaned text instead.
3. WHEN text was cleaned THEN the extension SHALL show a small notice with the counts and an "Undo" button that inserts the original paste instead (the user's explicit choice).
4. The extension SHALL use Gemini Nano (the Prompt API) for names and context when Chrome offers it, and rules only otherwise, and say which in the notice.
5. WHEN the user selects an AI answer and chooses "Restore with Airlock" from the context menu THEN the extension SHALL show the restored text in the extension's side panel, never by modifying the website's page.
6. The extension SHALL keep mappings in `chrome.storage.session` (memory only, cleared when the browser closes) and SHALL make no network requests of its own.
7. The popup SHALL let the user turn Airlock on or off per site and "Forget this browser session".

### R8: Honesty and safety
1. Every integration SHALL say "rules only" when no local model ran, so the user knows names may not be covered.
2. No integration SHALL log original values, mappings or the restored text to a console, file or network, apart from the restored file the user explicitly asked for.
