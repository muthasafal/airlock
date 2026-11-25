import { describe, it, expect } from 'vitest';
import type { GenerativeModel } from 'firebase/ai';
import { parseNanoJson, resolveSpans, chunkText, detectChunked, classifyTask, FALLBACK_CLASSIFICATION, NanoDetector } from '../src/index.js';

/** A stand-in for an on-device GenerativeModel that returns fixed JSON (fictional data). */
function fakeModel(reply: (prompt: string) => string, delayMs = 0): GenerativeModel {
  return {
    generateContent: async (prompt: string) => {
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      return { response: { text: () => reply(prompt), inferenceSource: 'on_device' } };
    },
  } as unknown as GenerativeModel;
}

describe('parseNanoJson', () => {
  it('keeps valid findings and drops invalid ones (model output is untrusted)', () => {
    const raw = JSON.stringify({
      findings: [
        { text: 'Priya Shah', category: 'PERSON', confidence: 0.9 },
        { text: 'x', category: 'NOT_A_CATEGORY', confidence: 0.9 },
        { text: 'Acme', category: 'ORG', confidence: 7 },
      ],
    });
    expect(parseNanoJson(raw)).toEqual([{ text: 'Priya Shah', category: 'PERSON', confidence: 0.9 }]);
  });
  it('survives non-JSON output', () => expect(parseNanoJson('sorry, I cannot')).toEqual([]));
});

describe('resolveSpans', () => {
  const src = 'Priya met priya.shah and PRIYA SHAH at Acme.';
  it('expands to all exact occurrences', () => {
    expect(resolveSpans([{ text: 'Acme', category: 'ORG', confidence: 0.8 }], src)).toEqual([
      { start: 39, end: 43, text: 'Acme', category: 'ORG', detector: 'NANO', confidence: 0.8 },
    ]);
  });
  it('falls back to case-insensitive search', () => {
    expect(resolveSpans([{ text: 'priya shah', category: 'PERSON', confidence: 0.9 }], src).map((f) => f.text)).toEqual(['PRIYA SHAH']);
  });
  it('drops hallucinated spans', () => expect(resolveSpans([{ text: 'Rohan', category: 'PERSON', confidence: 0.9 }], src)).toEqual([]));
});

describe('chunkText', () => {
  it('keeps short text in one chunk', () => expect(chunkText('hello')).toEqual([{ text: 'hello', offset: 0 }]));
  it('splits long text at paragraphs with overlap and covers everything', () => {
    const para = 'word '.repeat(300).trim();
    const text = Array.from({ length: 6 }, () => para).join('\n\n');
    const chunks = chunkText(text, 4000, 200);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.text.length <= 4000)).toBe(true);
    for (let i = 1; i < chunks.length; i++) expect(chunks[i].offset).toBeLessThan(chunks[i - 1].offset + chunks[i - 1].text.length);
    const last = chunks[chunks.length - 1];
    expect(last.offset + last.text.length).toBe(text.length);
  });
});

describe('detectChunked / NanoDetector', () => {
  it('resolves findings with absolute offsets and expands across chunks', async () => {
    const text = 'Priya Shah wrote this. ' + 'filler text. '.repeat(400) + 'Ask Priya Shah.';
    const model = fakeModel((p) => JSON.stringify({ findings: p.startsWith('Priya') ? [{ text: 'Priya Shah', category: 'PERSON', confidence: 0.9 }] : [] }));
    const r = await detectChunked(model, text, { chunkChars: 4000, overlap: 200 });
    expect(r.findings.map((f) => f.start)).toEqual([0, text.lastIndexOf('Priya Shah')]);
    expect(r.timedOut).toBe(false);
  });
  it('marks a timeout as reduced protection instead of throwing', async () => {
    const detector = new NanoDetector(fakeModel(() => '{"findings":[]}', 50), { timeoutMs: 10 });
    expect(await detector.detect('Priya', { nanoMinConfidence: 0.5 })).toEqual([]);
    expect(detector.lastTimedOut).toBe(true);
  });
});

describe('classifyTask', () => {
  it('parses the enum output', async () => {
    const model = fakeModel(() => '{"task":"REWRITE","complexity":"LOW"}');
    expect(await classifyTask(model, 'rewrite this')).toEqual({ task: 'REWRITE', complexity: 'LOW' });
  });
  it('falls back to cloud-safe defaults on bad output', async () => {
    expect(await classifyTask(fakeModel(() => 'nope'), 'x')).toEqual(FALLBACK_CLASSIFICATION);
  });
});
