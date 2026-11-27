import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createSessionMapping, type SessionMapping } from '@airlock/scrub-engine';

/**
 * Encrypted session store for the CLI and MCP server (integrations R1.6 to R1.8).
 * Sessions live in ~/.airlock/sessions (or $AIRLOCK_HOME), encrypted with AES-256-GCM under a
 * random 256-bit key in ~/.airlock/key (mode 0600 where supported). Nothing here touches the
 * network.
 */

export const DEFAULT_TTL_HOURS = 24;

export function airlockHome(): string {
  return process.env.AIRLOCK_HOME || join(homedir(), '.airlock');
}

const safeName = (session: string) => {
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(session)) throw new Error('Session names may use letters, digits, dot, dash and underscore (max 64).');
  return session;
};

function ensureHome(): string {
  const home = airlockHome();
  mkdirSync(join(home, 'sessions'), { recursive: true });
  try {
    chmodSync(home, 0o700);
  } catch {
    /* not supported on this OS */
  }
  return home;
}

function key(): Buffer {
  const file = join(ensureHome(), 'key');
  if (!existsSync(file)) {
    writeFileSync(file, randomBytes(32), { mode: 0o600 });
  }
  const k = readFileSync(file);
  if (k.length !== 32) throw new Error(`The Airlock key at ${file} is damaged. Delete it to start fresh (all sessions will be lost).`);
  return k;
}

export function serializeMapping(m: SessionMapping): string {
  return JSON.stringify({
    forward: [...m.forward],
    reverse: [...m.reverse],
    aliases: [...m.aliases],
    aliasForward: [...m.aliasForward],
    originals: [...m.originals],
    seed: m.seed,
  });
}

export function deserializeMapping(json: string): SessionMapping {
  const o = JSON.parse(json);
  return {
    forward: new Map(o.forward),
    reverse: new Map(o.reverse),
    aliases: new Map(o.aliases),
    aliasForward: new Map(o.aliasForward ?? []),
    originals: new Set(o.originals),
    seed: o.seed >>> 0,
  };
}

const sessionFile = (session: string) => join(ensureHome(), 'sessions', `${safeName(session)}.bin`);

/** Loads a session, or starts a fresh one when it is missing, expired or unreadable. */
export function loadSession(session = 'default'): SessionMapping {
  const file = sessionFile(session);
  if (existsSync(file)) {
    try {
      const raw = readFileSync(file);
      const expiresAt = Number(raw.readBigUInt64BE(0));
      if (expiresAt > Date.now()) {
        const iv = raw.subarray(8, 20);
        const tag = raw.subarray(20, 36);
        const decipher = createDecipheriv('aes-256-gcm', key(), iv);
        decipher.setAuthTag(tag);
        const plain = Buffer.concat([decipher.update(raw.subarray(36)), decipher.final()]);
        return deserializeMapping(plain.toString('utf8'));
      }
    } catch {
      /* unreadable: start fresh below */
    }
    rmSync(file, { force: true });
  }
  return createSessionMapping(randomBytes(4).readUInt32BE(0));
}

/** Saves a session: [8-byte expiry][12-byte IV][16-byte tag][ciphertext]. */
export function saveSession(mapping: SessionMapping, session = 'default', ttlHours = DEFAULT_TTL_HOURS): void {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(serializeMapping(mapping), 'utf8'), cipher.final()]);
  const header = Buffer.alloc(8);
  header.writeBigUInt64BE(BigInt(Date.now() + ttlHours * 3600_000));
  writeFileSync(sessionFile(session), Buffer.concat([header, iv, cipher.getAuthTag(), body]), { mode: 0o600 });
}

export function forgetSession(session = 'default'): void {
  rmSync(sessionFile(session), { force: true });
}

export function forgetAllSessions(): number {
  const dir = join(ensureHome(), 'sessions');
  const files = readdirSync(dir).filter((f) => f.endsWith('.bin'));
  for (const f of files) rmSync(join(dir, f), { force: true });
  return files.length;
}
