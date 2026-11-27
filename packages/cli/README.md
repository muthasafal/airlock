# @airlock/cli

`airlock` cleans secrets out of text before any AI sees it, and puts the real details back on your machine afterwards. It also runs as an MCP server for Claude Code, Claude Desktop, Codex, Cursor and Gemini CLI.

## Install

From the repo root:

```
npm install
npm run build -w packages/scrub-engine
npm run build -w packages/cli
npm link -w packages/cli
```

## Use

```
airlock scrub [file]      Clean text (stdin if no file). Summary on stderr, never the values.
airlock restore [file]    Put the real details back into an AI's answer.
airlock check [file]      Exit code 2 if it contains a key, token, password, private key, Aadhaar, PAN or card.
airlock forget [--all]    Delete a session's mapping (or every session).
airlock mcp               Run the MCP server over stdio.
airlock hook claude-code  Claude Code UserPromptSubmit hook: blocks prompts with secrets.

--session <name>          Which mapping to use (default "default"). Use the same name to restore.
--local-model <spec>      Also detect names and context with a local model, e.g. ollama:llama3.2 (127.0.0.1 only).
--ttl-hours <n>           Keep the session for n hours (default 24).
--json                    Machine-readable output for scrub and check.
```

Example:

```
airlock scrub contract.txt --session acme > clean.txt
# paste clean.txt into any AI, save its answer as answer.txt
airlock restore answer.txt --session acme > final.txt
```

## MCP tools

| Tool | Returns |
|---|---|
| `airlock_read_clean(path, session?)` | the file, cleaned, plus counts |
| `airlock_clean_text(text, session?)` | cleaned text plus counts |
| `airlock_restore_to_file(text, output_path, session?)` | writes the restored text to a local file; returns only the path and counts |
| `airlock_check(text)` | kinds and counts of secrets, never values |
| `airlock_forget(session)` | deletes a session |

Original values never go back into the model's context.

## Where your data lives

Sessions are stored in `~/.airlock/sessions` (or `$AIRLOCK_HOME`), encrypted with AES-256-GCM under a random key in `~/.airlock/key` (mode 0600). They expire after 24 hours. The CLI makes no network calls, except to a local model on 127.0.0.1 when you pass `--local-model`.

Without a local model, detection is rules only: emails, phones, Indian IDs, cards, bank details, UPI, IPs, keys, tokens, passwords and URL secrets. Names and organisations need `--local-model`, or the Airlock web app or extension, which use Gemini Nano.

## Tests

`npm test -w packages/cli`
