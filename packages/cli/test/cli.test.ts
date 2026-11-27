import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// Every test uses a throwaway Airlock home. All data is fictional.
const home = mkdtempSync(join(tmpdir(), 'airlock-test-'));
process.env.AIRLOCK_HOME = home;

const { cleanText, restoreText, checkText, describeBlocking } = await import('../src/engine.js');
const { loadSession, saveSession, forgetSession } = await import('../src/vault.js');
const { createServer, isAllowedOutputPath } = await import('../src/mcp.js');
const { parseLocalModel } = await import('../src/local-model.js');
const { main } = await import('../src/cli.js');

afterAll(() => rmSync(home, { recursive: true, force: true }));

const PEOPLE_EMAILS = ['priya.shah@acme.com', 'rohan.mehta@globex.in', 'meera.joshi@initech.io'];
const planted = fc.record({
  email: fc.constantFrom(...PEOPLE_EMAILS),
  phone: fc.tuple(fc.integer({ min: 6, max: 9 }), fc.integer({ min: 1000, max: 9999 }), fc.integer({ min: 10000, max: 99999 })).map(([a, b, c]) => `${a}${b} ${c}`),
  key: fc.stringMatching(/^[A-Za-z0-9]{24}$/).map((s) => `sk-ant-${s}`),
});

describe('P11: vault round trip', () => {
  it('a session saved to disk restores exactly what it cleaned', async () => {
    await fc.assert(
      fc.asyncProperty(planted, async (p) => {
        forgetSession('p11');
        const original = `Write to ${p.email} or call ${p.phone}. key: ${p.key}`;
        const cleaned = await cleanText(original, { session: 'p11' });
        expect(cleaned.text).not.toContain(p.email);
        expect(cleaned.text).not.toContain(p.key);
        expect(restoreText(cleaned.text, 'p11').text).toBe(original);
      }),
      { numRuns: 100 },
    );
  });

  it('stores sessions encrypted (no original value in the file)', async () => {
    forgetSession('enc');
    await cleanText('Write to priya.shah@acme.com now', { session: 'enc' });
    const bytes = readFileSync(join(home, 'sessions', 'enc.bin'));
    expect(bytes.toString('latin1')).not.toContain('priya.shah');
  });

  it('expired sessions start fresh', () => {
    const m = loadSession('ttl');
    m.forward.set('x', 'y');
    saveSession(m, 'ttl', -1);
    expect(loadSession('ttl').forward.size).toBe(0);
  });
});

describe('P12: the secret guard blocks secrets without echoing them', () => {
  it('blocks any planted key and never repeats it', () => {
    fc.assert(
      fc.property(planted, (p) => {
        const r = checkText(`please debug this, key ${p.key} fails`);
        expect(Object.keys(r.blocking)).toContain('API_KEY');
        expect(describeBlocking(r.blocking)).not.toContain(p.key);
      }),
      { numRuns: 200 },
    );
  });

  it('the Claude Code hook exits 2 on a secret and 0 otherwise', async () => {
    const run = async (prompt: string) => {
      const { Readable } = await import('node:stream');
      const stdin = Object.assign(Readable.from([Buffer.from(JSON.stringify({ prompt }))]), { isTTY: false });
      const original = process.stdin;
      Object.defineProperty(process, 'stdin', { value: stdin, configurable: true });
      try {
        return await main(['hook', 'claude-code']);
      } finally {
        Object.defineProperty(process, 'stdin', { value: original, configurable: true });
      }
    };
    expect(await run('summarise this meeting for me')).toBe(0);
    expect(await run('my password: hunter2xyz please fix')).toBe(2);
  });
});

describe('MCP server', () => {
  let client: Client;
  const work = mkdtempSync(join(tmpdir(), 'airlock-work-'));
  const cwd = process.cwd();

  beforeAll(async () => {
    process.chdir(work);
    const [a, b] = InMemoryTransport.createLinkedPair();
    await createServer().connect(a);
    client = new Client({ name: 'test', version: '0.0.0' });
    await client.connect(b);
  });
  afterAll(() => {
    process.chdir(cwd);
    rmSync(work, { recursive: true, force: true });
  });

  const textOf = (r: unknown) => ((r as { content: Array<{ text: string }> }).content[0]?.text ?? '');

  it('lists the five tools', async () => {
    const names = (await client.listTools()).tools.map((t) => t.name).sort();
    expect(names).toEqual(['airlock_check', 'airlock_clean_text', 'airlock_forget', 'airlock_read_clean', 'airlock_restore_to_file']);
  });

  it('P10: reads a file cleaned and restores only into a file, never into the result', async () => {
    await fc.assert(
      fc.asyncProperty(planted, async (p) => {
        await client.callTool({ name: 'airlock_forget', arguments: { session: 'p10' } });
        writeFileSync(join(work, 'notes.txt'), `Client ${p.email}, phone ${p.phone}, key ${p.key}`);
        const read = textOf(await client.callTool({ name: 'airlock_read_clean', arguments: { path: 'notes.txt', session: 'p10' } }));
        for (const v of [p.email, p.phone, p.key]) expect(read).not.toContain(v);
        const cleanedBody = read.split('\n\n[Airlock')[0];
        const res = textOf(await client.callTool({ name: 'airlock_restore_to_file', arguments: { text: `Reply: ${cleanedBody}`, output_path: 'out/final.txt', session: 'p10' } }));
        for (const v of [p.email, p.phone, p.key]) expect(res).not.toContain(v);
        expect(readFileSync(join(work, 'out', 'final.txt'), 'utf8')).toContain(p.email);
      }),
      { numRuns: 25 },
    );
  });

  it('P13: refuses to write outside the project and home', async () => {
    const outside = process.platform === 'win32' ? 'C:\\Windows\\Temp\\airlock-x.txt' : '/etc/airlock-x.txt';
    const r = await client.callTool({ name: 'airlock_restore_to_file', arguments: { text: 'x', output_path: outside } });
    expect((r as { isError?: boolean }).isError).toBe(true);
    expect(isAllowedOutputPath('sub/dir/file.txt')).toBe(true);
  });

  it('check reports kinds, not values', async () => {
    const r = textOf(await client.callTool({ name: 'airlock_check', arguments: { text: 'card 4111 1111 1111 1111' } }));
    expect(r).toMatch(/card/i);
    expect(r).not.toContain('4111');
  });
});

describe('local model guard', () => {
  it('accepts loopback only', () => {
    expect(parseLocalModel('ollama:llama3.2').baseUrl).toBe('http://127.0.0.1:11434');
    expect(() => parseLocalModel('ollama:llama3.2@https://api.example.com')).toThrow(/this machine/);
  });
});
