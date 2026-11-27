---
name: airlock
description: Keep the user's secrets on their machine. Use whenever the user shares or points to sensitive material (client or customer data, HR, salary, medical, legal, contracts, invoices, bank or ID numbers, logs or configs with API keys, tokens or passwords), asks to post content outside this machine (issues, tickets, web forms, another AI), or asks to "clean", "redact", "anonymise" or "scrub" text. Airlock swaps sensitive details for realistic stand-ins locally and restores them only into files the user opens.
---

# Airlock: secrets stay on this side of the door

Airlock is a local privacy layer. It finds sensitive details (names, emails, phones, Aadhaar, PAN, card and bank numbers, IPs, URLs with tokens, API keys, JWTs, private keys, passwords and, with a local model, organisations, places, health and legal matters) and swaps them for realistic, consistent stand-ins, such as "Priya Shah" becoming "Maya Iyer". Secrets become `‹secret-1›`. The mapping stays encrypted on the user's machine, and restoring happens there too.

You are a cloud model. **The originals must not enter your context**, and you must not write them anywhere except a file the user asked for, through Airlock.

## When to use it

Use Airlock without being asked when any of these is true:
- The user points you at a file that likely holds personal or confidential data: client lists, CRM exports, HR or payroll sheets, medical notes, contracts, invoices, bank statements, `.env`, logs or configs with credentials.
- You are about to send content outside this machine: a GitHub issue or PR body, a ticket, a chat message, a web form, a search query, or another AI or API.
- The user asks you to clean, redact, anonymise, scrub or pseudonymise text.

Do not use it for ordinary source code without secrets, or for public information.

## How to use it

Prefer the MCP tools when they are connected. Otherwise use the `airlock` command line.

| Task | MCP tool | Command line |
|---|---|---|
| Read a sensitive file | `airlock_read_clean` with `path` | `airlock scrub path/to/file` |
| Clean text before sending it out | `airlock_clean_text` with `text` | `echo "..." \| airlock scrub` |
| Write the final document with the real details | `airlock_restore_to_file` with `text`, `output_path` | `airlock restore draft.txt > final.txt` |
| Check whether text holds secrets | `airlock_check` | `airlock check file` (exit 2 means yes) |
| Forget the mapping | `airlock_forget` | `airlock forget --session name` |

Use one `session` name per task (for example the client or ticket name). Use the same name to restore.

## Rules

1. **Read sensitive files cleaned.** Use `airlock_read_clean` (or `airlock scrub`) instead of reading the raw file. If you already read a raw file by mistake, don't quote its sensitive values anywhere: clean the text before any further use, and tell the user.
2. **Work with the stand-ins as if they were real.** They are consistent, so the same person is always the same stand-in. Write your draft using them.
3. **Restore only into files.** When the user wants the final version with real details, call `airlock_restore_to_file` (or tell the user to run `airlock restore`). Never print restored values in chat, and never try to work out which original a stand-in stands for.
4. **Never guess a withheld secret.** `‹secret-N›` placeholders mean a key, token or password was held back. Refer to it by its label, for example "the key in ‹secret-1›". If the task truly needs the value, ask the user to supply it locally (an environment variable or their secret manager), not in chat.
5. **Clean before anything leaves.** Before posting to an external service, run `airlock_clean_text` on the content and post the cleaned version.
6. **Be honest about coverage.** If Airlock reports "rules only", names, organisations and other context may not be covered. Say so, and suggest `--local-model ollama:<model>` or the Airlock web app or extension, which use an on-device model.

## Install (for the user)

- Command line: from the Airlock repo run `npm install`, `npm run build -w packages/scrub-engine`, `npm run build -w packages/cli`, then `npm link -w packages/cli`, which puts `airlock` on your PATH.
- MCP setup for Claude Desktop, Claude Code, Codex, Cursor and Gemini CLI: see `integrations/README.md`.
