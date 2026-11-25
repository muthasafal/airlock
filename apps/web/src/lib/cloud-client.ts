import type { Content } from 'firebase/ai';
import { getCloudGenerativeModel } from '../firebase/ai';

/**
 * Cloud AI Logic client with branded ScrubbedText type.
 * Prevents the type system from ever passing raw text to the cloud.
 * BRIEF §P0-6: streaming with scrubbed history only.
 */

declare const __brand: unique symbol;

/** Brand type for text that has been scrubbed and is safe to send to cloud. */
export type ScrubbedText = string & { [__brand]: 'ScrubbedText' };

/** Type-safe wrapper to mark text as scrubbed. Only call this on scrub() output. */
export function asScrubbed(s: string): ScrubbedText {
  return s as ScrubbedText;
}

export interface ScrubbedHistoryEntry {
  role: 'user' | 'model';
  content: ScrubbedText;
}

export interface CloudChunk {
  text: string;
  inferenceSource?: string;
}

/**
 * Streams a cloud answer. Uses ONLY_IN_CLOUD with the scrubbed history (Nano is single-turn,
 * so the multi-turn conversation runs in the cloud on stand-in text only).
 * Never accepts raw text; enforced by the ScrubbedText branded type.
 * BRIEF §P0-6.
 */
export async function* sendScrubbed(
  scrubbed: ScrubbedText,
  history: ScrubbedHistoryEntry[],
  model: string,
): AsyncIterable<CloudChunk> {
  const m = getCloudGenerativeModel(model);
  if (!m) throw new Error('The cloud model is not set up yet (Firebase config missing).');
  const contents: Content[] = [
    ...history.map((h) => ({ role: h.role, parts: [{ type: 'text' as const, text: h.content }] })),
    { role: 'user', parts: [{ type: 'text' as const, text: scrubbed }] },
  ];
  const result = await m.generateContentStream({ contents });
  for await (const chunk of result.stream) {
    yield { text: chunk.text(), inferenceSource: chunk.inferenceSource };
  }
}
