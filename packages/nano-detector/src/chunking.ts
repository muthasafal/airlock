import type { Finding } from '@airlock/scrub-engine';
import type { GenerativeModel } from 'firebase/ai';
import { detectWithNano } from './detection.js';
import { resolveSpans } from './span-resolution.js';

/**
 * Text chunking for multi-chunk Nano detection.
 * BRIEF §8.1 Layer B: Chunking, 4000 chars, 200 overlap.
 */

export interface Chunk {
  text: string;
  offset: number;
}

export interface ChunkedDetectionResult {
  findings: Finding[];
  timedOut: boolean;
  chunksProcessed: number;
}

/**
 * Splits text into chunks of at most `chunkSize` characters, preferring paragraph boundaries,
 * then line or sentence boundaries, with `overlap` characters repeated between neighbours so a
 * span cut at a boundary is still seen whole in one chunk.
 */
export function chunkText(text: string, chunkSize = 4000, overlap = 200): Chunk[] {
  if (text.length <= chunkSize) return [{ text, offset: 0 }];
  const chunks: Chunk[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + chunkSize);
    if (end < text.length) {
      const window = text.slice(start + Math.floor(chunkSize / 2), end);
      const para = window.lastIndexOf('\n\n');
      const line = window.lastIndexOf('\n');
      const sentence = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '));
      const cut = para >= 0 ? para + 2 : line >= 0 ? line + 1 : sentence >= 0 ? sentence + 2 : -1;
      if (cut > 0) end = start + Math.floor(chunkSize / 2) + cut;
    }
    chunks.push({ text: text.slice(start, end), offset: start });
    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

/**
 * Runs detection across all chunks sequentially (Nano is single-session), resolves spans per
 * chunk, merges duplicates from the overlaps and reports progress via onProgress(0..100).
 * A chunk that times out (8 s) is skipped and marks the result timedOut. BRIEF §8.1 Layer B.
 */
export async function detectChunked(
  model: GenerativeModel,
  text: string,
  options: { chunkChars?: number; overlap?: number; timeoutMs?: number; onProgress?: (pct: number) => void } = {},
): Promise<ChunkedDetectionResult> {
  const chunks = chunkText(text, options.chunkChars ?? 4000, options.overlap ?? 200);
  const seen = new Set<string>();
  const findings: Finding[] = [];
  let timedOut = false;
  let processed = 0;
  for (const chunk of chunks) {
    const r = await detectWithNano(model, chunk.text, options.timeoutMs ?? 8000);
    timedOut ||= r.timedOut;
    for (const f of resolveSpans(r.findings, chunk.text, chunk.offset)) {
      const key = `${f.start}:${f.end}:${f.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        findings.push(f);
      }
    }
    processed++;
    options.onProgress?.(Math.round((processed / chunks.length) * 100));
  }
  // Expand every confirmed span to all its occurrences in the full text (a name in chunk 1 may recur in chunk 3).
  const expanded = resolveSpans(
    [...new Map(findings.map((f) => [f.text.toLowerCase(), { text: f.text, category: f.category, confidence: f.confidence }])).values()],
    text,
  );
  for (const f of expanded) {
    const key = `${f.start}:${f.end}:${f.category}`;
    if (!seen.has(key)) {
      seen.add(key);
      findings.push(f);
    }
  }
  return { findings, timedOut, chunksProcessed: processed };
}
