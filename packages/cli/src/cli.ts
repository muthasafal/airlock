#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { checkText, cleanText, describeBlocking, restoreText, summary } from './engine.js';
import { forgetAllSessions, forgetSession } from './vault.js';

/**
 * `airlock`: clean secrets out of text before any AI sees it, and restore them locally.
 * Integrations R1 (CLI), R3 (`airlock mcp`), R5.2 (`airlock hook claude-code`).
 */

const HELP = `airlock: keep your secrets on this side of the door

Usage
  airlock scrub [file]      Clean text (stdin if no file) and print it. Summary goes to stderr.
  airlock restore [file]    Put the real details back into an AI's answer.
  airlock check [file]      Exit 2 if the text holds a secret (key, token, password, Aadhaar, PAN, card).
  airlock forget [--all]    Delete this session's mapping (or every session).
  airlock mcp               Run the MCP server (Claude Desktop, Claude Code, Codex, Cursor, Gemini CLI).
  airlock hook claude-code  UserPromptSubmit hook: blocks prompts that contain secrets.

Options
  --session <name>          Which mapping to use (default "default"). Use the same name to restore.
  --local-model <spec>      Also detect names and context with a local model, e.g. ollama:llama3.2
                            (runs on 127.0.0.1 only; nothing leaves this machine).
  --ttl-hours <n>           Keep the session for n hours (default 24).
  --json                    Machine-readable output for scrub and check.

Examples
  airlock scrub contract.txt > clean.txt        then paste clean.txt into any AI
  airlock restore answer.txt > final.txt        real names back, on your machine
`;

function parse(argv: string[]) {
  const args: string[] = [];
  const opts: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json' || a === '--all' || a === '--help' || a === '-h') opts[a.replace(/^-+/, '')] = true;
    else if (a.startsWith('--')) opts[a.slice(2)] = argv[++i] ?? '';
    else args.push(a);
  }
  return { args, opts };
}

async function readInput(file?: string): Promise<string> {
  if (file && file !== '-') return readFileSync(file, 'utf8');
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const { args, opts } = parse(argv);
  const [cmd, ...rest] = args;
  const session = typeof opts.session === 'string' ? opts.session : 'default';
  const ttlHours = typeof opts['ttl-hours'] === 'string' ? Number(opts['ttl-hours']) || 24 : 24;
  const localModel = typeof opts['local-model'] === 'string' ? opts['local-model'] : undefined;

  switch (cmd) {
    case 'scrub': {
      const r = await cleanText(await readInput(rest[0]), { session, localModel, ttlHours });
      if (opts.json) process.stdout.write(JSON.stringify({ text: r.text, counts: r.counts, withheldSecrets: r.withheldSecrets, detection: r.detection }) + '\n');
      else {
        process.stdout.write(r.text);
        process.stderr.write(`\nAirlock: ${summary(r)} Session "${session}".\n`);
      }
      return 0;
    }
    case 'restore': {
      const r = restoreText(await readInput(rest[0]), session);
      process.stdout.write(r.text);
      process.stderr.write(`\nAirlock: ${r.restored} real detail${r.restored === 1 ? '' : 's'} restored, on this machine.\n`);
      return 0;
    }
    case 'check': {
      const r = checkText(await readInput(rest[0]));
      if (opts.json) process.stdout.write(JSON.stringify(r) + '\n');
      if (Object.keys(r.blocking).length) {
        process.stderr.write(describeBlocking(r.blocking) + '\n');
        return 2;
      }
      if (!opts.json) process.stderr.write('Airlock: no secrets found.\n');
      return 0;
    }
    case 'forget': {
      if (opts.all) process.stderr.write(`Airlock: forgot ${forgetAllSessions()} session(s).\n`);
      else {
        forgetSession(session);
        process.stderr.write(`Airlock: forgot session "${session}".\n`);
      }
      return 0;
    }
    case 'mcp': {
      const { runMcpServer } = await import('./mcp.js');
      await runMcpServer();
      return -1; // keep running
    }
    case 'hook': {
      // Claude Code UserPromptSubmit: JSON on stdin with a "prompt" field. Exit 2 blocks the prompt.
      const raw = await readInput();
      let prompt = raw;
      try {
        prompt = (JSON.parse(raw) as { prompt?: string }).prompt ?? '';
      } catch {
        /* plain text */
      }
      const r = checkText(prompt);
      if (Object.keys(r.blocking).length) {
        process.stderr.write(describeBlocking(r.blocking) + '\n');
        return 2;
      }
      return 0;
    }
    default:
      process.stdout.write(HELP);
      return cmd && !opts.help && !opts.h ? 1 : 0;
  }
}

const isEntry = process.argv[1] && /cli\.(js|ts)$/.test(process.argv[1].replace(/\\/g, '/'));
if (isEntry) {
  main().then(
    (code) => {
      if (code >= 0) process.exitCode = code;
    },
    (e) => {
      process.stderr.write(`Airlock: ${e instanceof Error ? e.message : String(e)}\n`);
      process.exitCode = 1;
    },
  );
}
