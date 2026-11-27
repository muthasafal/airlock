import { readFileSync, writeFileSync, mkdirSync, realpathSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { checkText, cleanText, restoreText, summary } from './engine.js';
import { forgetSession } from './vault.js';

/**
 * Airlock MCP server (integrations R3), for Claude Desktop, Claude Code, Codex, Cursor and
 * Gemini CLI. Design rule: the original values never go back into the model's context.
 * Files are read cleaned; restored text is only ever written to a local file.
 */

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] });
const fail = (t: string) => ({ content: [{ type: 'text' as const, text: t }], isError: true });

/** True when `target` is inside the working directory or the user's home (integrations R3.7, P13). */
export function isAllowedOutputPath(target: string, cwd = process.cwd(), home = homedir()): boolean {
  const abs = resolve(cwd, target);
  const parent = existsSync(dirname(abs)) ? realpathSync(dirname(abs)) : dirname(abs);
  const inside = (root: string) => {
    const r = relative(realpathSync(root), parent);
    return r === '' || (!r.startsWith('..') && !isAbsolute(r));
  };
  return inside(cwd) || inside(home);
}

const session = z.string().regex(/^[A-Za-z0-9._-]{1,64}$/).optional().describe('Session name. Use the same one to restore later. Default "default".');

export function createServer(): McpServer {
  const server = new McpServer({ name: 'airlock', version: '0.1.0' });

  server.registerTool(
    'airlock_read_clean',
    {
      title: 'Read a file, cleaned',
      description:
        'Read a local file with sensitive details (names, emails, phones, IDs, keys, amounts) swapped for realistic stand-ins and secrets withheld as ‹secret-N›. Use this INSTEAD of reading client, HR, medical, legal or credential-bearing files raw. Restore later with airlock_restore_to_file.',
      inputSchema: { path: z.string().describe('Path to the file'), session },
      annotations: { readOnlyHint: true },
    },
    async ({ path, session: s }) => {
      try {
        const raw = readFileSync(resolve(process.cwd(), path), 'utf8');
        const r = await cleanText(raw, { session: s });
        return text(`${r.text}\n\n[Airlock: ${summary(r)}]`);
      } catch (e) {
        return fail(`Could not read that file: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  );

  server.registerTool(
    'airlock_clean_text',
    {
      title: 'Clean text',
      description:
        'Swap sensitive details in text for stand-ins before sending it anywhere outside this machine (an issue, a ticket, a web form, another AI). Returns only the cleaned text and counts.',
      inputSchema: { text: z.string(), session },
    },
    async ({ text: t, session: s }) => {
      const r = await cleanText(t, { session: s });
      return text(`${r.text}\n\n[Airlock: ${summary(r)}]`);
    },
  );

  server.registerTool(
    'airlock_restore_to_file',
    {
      title: 'Restore real details into a local file',
      description:
        'Write the final text with the real details put back, to a local file the user will open. Returns only the path and counts, never the restored text. Do not try to restore values yourself.',
      inputSchema: {
        text: z.string().describe('Text that contains Airlock stand-ins'),
        output_path: z.string().describe('Where to write the restored file (inside the project or home folder)'),
        session,
      },
    },
    async ({ text: t, output_path, session: s }) => {
      if (!isAllowedOutputPath(output_path)) return fail('That path is outside this project and your home folder, so Airlock will not write there.');
      const r = restoreText(t, s ?? 'default');
      const abs = resolve(process.cwd(), output_path);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, r.text, 'utf8');
      return text(`Wrote ${r.text.length} characters to ${abs}, with ${r.restored} real detail${r.restored === 1 ? '' : 's'} restored. The restored values are not shown here on purpose.`);
    },
  );

  server.registerTool(
    'airlock_check',
    {
      title: 'Check text for secrets',
      description: 'Report which kinds of sensitive details and secrets a text contains (counts only, never the values).',
      inputSchema: { text: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ text: t }) => {
      const r = checkText(t);
      const all = Object.entries(r.all).map(([c, n]) => `${n} ${c.toLowerCase()}`).join(', ') || 'nothing sensitive';
      const block = Object.keys(r.blocking).length ? ` Secrets that must not be shared: ${Object.keys(r.blocking).join(', ').toLowerCase()}.` : '';
      return text(`Found: ${all}.${block}`);
    },
  );

  server.registerTool(
    'airlock_forget',
    {
      title: 'Forget a session',
      description: 'Delete a session mapping from this machine. After this, its stand-ins can no longer be restored.',
      inputSchema: { session: z.string().regex(/^[A-Za-z0-9._-]{1,64}$/) },
      annotations: { destructiveHint: true },
    },
    async ({ session: s }) => {
      forgetSession(s);
      return text(`Forgot session "${s}".`);
    },
  );

  return server;
}

export async function runMcpServer(): Promise<void> {
  await createServer().connect(new StdioServerTransport());
}
