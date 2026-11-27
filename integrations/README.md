# Airlock everywhere: integrations

Airlock's rule is the same in every tool: **sensitive details are swapped on your device before any AI sees them, and the real ones come back only where you can see them.**

| You use | Install | What it does |
|---|---|---|
| ChatGPT, Claude.ai, Gemini, Copilot, Perplexity, DeepSeek in Chrome | [Chrome extension](#chrome-extension) | Cleans what you paste before the site gets it. "Restore with Airlock" shows answers with your real details in a side panel. |
| Claude Code | [Plugin](#claude-code) | Skill, MCP tools, and a hook that blocks prompts containing keys, passwords or ID numbers |
| Codex | [MCP + AGENTS.md](#codex) | Same tools and rules |
| Claude Desktop, Cursor, Gemini CLI | [MCP](#claude-desktop-cursor-gemini-cli) | Same tools |
| Claude apps (claude.ai Skills) | [Skill](#the-skill) | Tells Claude when and how to use Airlock |
| Any terminal, any AI | [`airlock` CLI](#command-line) | `airlock scrub`, `airlock restore`, `airlock check` |

Detection: the extension and the web app use **Gemini Nano on your device** when Chrome offers it, plus the rule checks. The CLI and MCP server use the rule checks, plus an optional **local** model through Ollama (`--local-model ollama:llama3.2`, loopback only). Anything that only ran rules says "rules only", because names and context may then slip through.

---

## Command line

From the repo root:

```
npm install
npm run build -w packages/scrub-engine
npm run build -w packages/cli
npm link -w packages/cli
```

Then `airlock --help`. Typical use:

```
airlock scrub contract.txt --session acme > clean.txt     # paste clean.txt into any AI
airlock restore answer.txt --session acme > final.txt     # real details back, on your machine
airlock check .env                                        # exit code 2 if it holds a secret
airlock forget --session acme                             # delete the mapping
```

Sessions are encrypted with AES-256-GCM in `~/.airlock` (set `AIRLOCK_HOME` to move it) and expire after 24 hours (`--ttl-hours`).

## MCP server

`airlock mcp` runs an MCP server over stdio with five tools:

| Tool | What it returns |
|---|---|
| `airlock_read_clean(path, session?)` | the file's text, cleaned, plus counts |
| `airlock_clean_text(text, session?)` | cleaned text plus counts |
| `airlock_restore_to_file(text, output_path, session?)` | writes the restored text to a local file; returns **only** the path and counts |
| `airlock_check(text)` | kinds and counts of secrets, never values |
| `airlock_forget(session)` | deletes a session |

The model never receives your original values: it reads files cleaned and writes restored output to disk.

## Claude Code

Install the plugin from this repo (it bundles the skill, the MCP server config and a `UserPromptSubmit` secret guard):

```
claude plugin install ./integrations/claude-code
```

Or add the pieces by hand:
- MCP: `claude mcp add airlock -- airlock mcp`
- Skill: copy `integrations/skill/airlock` to `~/.claude/skills/airlock`
- Hook: copy the `UserPromptSubmit` block from `integrations/claude-code/hooks/hooks.json` into `~/.claude/settings.json`

## Codex

1. Add the block from `integrations/codex/config.toml` to `~/.codex/config.toml`.
2. Paste `integrations/codex/AGENTS.md` into your project's `AGENTS.md` (or `~/.codex/AGENTS.md` for every project).
3. Optional: copy `integrations/skill/airlock` to `~/.codex/skills/airlock` if your Codex version loads skills.

## Claude Desktop, Cursor, Gemini CLI

Merge the matching file into the app's config:
- Claude Desktop: `integrations/claude-desktop/claude_desktop_config.json`, into `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS). Then restart Claude Desktop.
- Cursor: `integrations/cursor/mcp.json`, into `.cursor/mcp.json` in your project or `~/.cursor/mcp.json`.
- Gemini CLI: `integrations/gemini-cli/settings.json`, into `~/.gemini/settings.json`.

## The skill

`integrations/skill/airlock/SKILL.md` is a standard Agent Skill. Upload the `airlock` folder as a zip in Claude (Settings, then Capabilities, then Skills), or copy it into `~/.claude/skills/` for Claude Code. It tells the model to read sensitive files cleaned, restore only into files, never print restored values, and never guess a `‹secret-N›`.

## Chrome extension

```
npm run build -w apps/extension
```

1. Open `chrome://extensions` and turn on **Developer mode** (top right).
2. Click **Load unpacked** and choose `apps/extension/dist`.
3. Open ChatGPT, Claude.ai or Gemini and paste something with an email or a key in it. A small dark notice shows what Airlock swapped, with **Undo** if you really want the original.
4. To read an answer with your real details: select it, right-click, and choose **Restore with Airlock**. It opens in the side panel. Airlock never writes your real details into the website's page, because the site's own scripts could read them there.
5. The toolbar popup turns Airlock on or off per site and can forget the browser session.

Chrome 137 and later no longer accept command-line extension loading, so the automated test (`npx playwright test` in `apps/extension`) runs in Microsoft Edge. Set `AIRLOCK_EXT_CHANNEL=chromium` to use Playwright's Chromium instead.

### What ChatGPT's own apps can and can't do

ChatGPT's desktop and web apps only connect to *remote* MCP servers (in developer mode), not to local ones like `airlock mcp`. A remote server would mean sending your raw text to a server, which is exactly what Airlock avoids. So for ChatGPT, use the Chrome extension or the clipboard airlock (`/clipboard` in the web app).
