import {
  buildPolicy,
  countByCategory,
  createSessionMapping,
  detectRules,
  restore,
  scrubWithFindings,
  type Finding,
  type SessionMapping,
} from '@airlock/scrub-engine';
import type { CleanReply, Msg, StatusReply } from './sites';

/**
 * Airlock extension service worker (integrations R7). It holds the session mapping in
 * chrome.storage.session (memory only, gone when the browser closes), cleans text for the
 * content script, uses Gemini Nano through the Prompt API when Chrome offers it, and restores
 * selected answers into the side panel. It makes no network requests.
 */

const KEY = 'airlock-mapping';

async function loadMapping(): Promise<SessionMapping> {
  const got = (await chrome.storage.session.get(KEY))[KEY] as string | undefined;
  if (!got) return createSessionMapping(crypto.getRandomValues(new Uint32Array(1))[0]);
  const o = JSON.parse(got);
  return {
    forward: new Map(o.forward),
    reverse: new Map(o.reverse),
    aliases: new Map(o.aliases),
    aliasForward: new Map(o.aliasForward ?? []),
    originals: new Set(o.originals),
    seed: o.seed >>> 0,
  };
}

async function saveMapping(m: SessionMapping): Promise<void> {
  await chrome.storage.session.set({
    [KEY]: JSON.stringify({
      forward: [...m.forward],
      reverse: [...m.reverse],
      aliases: [...m.aliases],
      aliasForward: [...m.aliasForward],
      originals: [...m.originals],
      seed: m.seed,
    }),
  });
}

// ---------- Gemini Nano (Prompt API), when Chrome offers it in the extension ----------
const SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          category: {
            type: 'string',
            enum: ['PERSON', 'ORG', 'LOCATION', 'HEALTH', 'FINANCIAL_AMOUNT', 'LEGAL_MATTER', 'INTERNAL_PROJECT', 'CREDENTIAL', 'GOVERNMENT_ID', 'DATE_OF_BIRTH', 'OTHER_SENSITIVE'],
          },
          confidence: { type: 'number' },
        },
        required: ['text', 'category', 'confidence'],
      },
    },
  },
  required: ['findings'],
};
const SYSTEM =
  'You are a privacy filter. List every span that identifies a person, organisation, private place, health condition, money amount tied to a person or company, legal matter, internal project or credential. Copy each span exactly as written. Do not explain.';
const IO = { expectedInputs: [{ type: 'text', languages: ['en'] }], expectedOutputs: [{ type: 'text', languages: ['en'] }] };

interface LM {
  availability(o?: unknown): Promise<string>;
  create(o?: unknown): Promise<{ prompt(t: string, o?: unknown): Promise<string>; destroy(): void }>;
}
const lm = () => (globalThis as unknown as { LanguageModel?: LM }).LanguageModel;

async function nanoStatus(): Promise<string> {
  try {
    return lm() ? await lm()!.availability(IO) : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

async function nanoFindings(text: string, timeoutMs = 20000): Promise<Finding[] | null> {
  const api = lm();
  if (!api || (await nanoStatus()) !== 'available') return null;
  try {
    const session = await api.create({ ...IO, initialPrompts: [{ role: 'system', content: SYSTEM }] });
    try {
      const raw = await Promise.race([
        session.prompt(text.slice(0, 20000), { responseConstraint: SCHEMA }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
      ]);
      const items = (JSON.parse(raw).findings ?? []) as Array<{ text: string; category: string; confidence: number }>;
      const out: Finding[] = [];
      for (const it of items) {
        const needle = (it.text ?? '').trim();
        if (needle.length < 2) continue;
        let from = 0;
        let at = text.indexOf(needle);
        if (at < 0) {
          const lower = text.toLowerCase();
          for (at = lower.indexOf(needle.toLowerCase()); at >= 0; at = lower.indexOf(needle.toLowerCase(), at + needle.length)) {
            out.push({ start: at, end: at + needle.length, text: text.slice(at, at + needle.length), category: it.category as Finding['category'], detector: 'NANO', confidence: Number(it.confidence) || 0.6 });
          }
          continue;
        }
        for (; at >= 0; at = text.indexOf(needle, from)) {
          out.push({ start: at, end: at + needle.length, text: needle, category: it.category as Finding['category'], detector: 'NANO', confidence: Number(it.confidence) || 0.6 });
          from = at + needle.length;
        }
      }
      return out;
    } finally {
      session.destroy();
    }
  } catch {
    return null;
  }
}

// ---------- Messages from the content script and popup ----------
async function clean(text: string): Promise<CleanReply> {
  const mapping = await loadMapping();
  const nano = await nanoFindings(text);
  const r = scrubWithFindings(text, [...detectRules(text), ...(nano ?? [])], mapping, buildPolicy({}));
  await saveMapping(mapping);
  const counts = countByCategory(r.findings);
  return {
    text: r.text,
    changed: Object.values(counts).reduce((a, b) => a + (b ?? 0), 0),
    withheld: r.actions.filter((a) => a.action === 'BLOCK').length,
    detection: nano ? 'rules + Gemini Nano' : 'rules only',
  };
}

chrome.runtime.onMessage.addListener((msg: Msg, _sender, reply) => {
  if (msg.type === 'clean') {
    clean(msg.text).then(reply, () => reply(null));
    return true;
  }
  if (msg.type === 'status') {
    nanoStatus().then((nano) => reply({ nano } satisfies StatusReply));
    return true;
  }
  if (msg.type === 'forget') {
    chrome.storage.session.remove([KEY, 'airlock-restored']).then(() => reply(true));
    return true;
  }
  return false;
});

// ---------- Restore into the side panel (never into the website's page) ----------
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'airlock-restore', title: 'Restore with Airlock', contexts: ['selection'] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'airlock-restore' || !tab?.windowId) return;
  // Open first, inside the user gesture; then fill the panel.
  void chrome.sidePanel.open({ windowId: tab.windowId });
  void (async () => {
    const mapping = await loadMapping();
    const r = restore(info.selectionText ?? '', mapping);
    await chrome.storage.session.set({ 'airlock-restored': JSON.stringify({ text: r.text, spans: r.restoredSpans, at: Date.now() }) });
  })();
});
