/**
 * Cloud AI Logic client with branded ScrubbedText type.
 * Prevents the type system from ever passing raw text to the cloud.
 * BRIEF §P0-6: streaming with scrubbed history only.
 */

declare const __brand: unique symbol;

/** Brand type for text that has been scrubbed and is safe to send to cloud. */
export type ScrubbedText = string & { [__brand]: 'ScrubbedText' };

/** Type-safe wrapper to mark text as scrubbed. */
export function asScrubbed(s: string): ScrubbedText {
  return s as ScrubbedText;
}

export interface ScrubbedHistoryEntry {
  role: 'user' | 'model';
  content: ScrubbedText;
}

/**
 * Streams a cloud answer. Uses ONLY_IN_CLOUD with the scrubbed history.
 * Never accepts raw text; enforced by the ScrubbedText branded type.
 * BRIEF §P0-6.
 */
// eslint-disable-next-line require-yield
export async function* sendScrubbed(
  _scrubbed: ScrubbedText,
  _history: ScrubbedHistoryEntry[],
  _model: string,
): AsyncIterable<string> {
  throw new Error('not implemented: architecture-skeleton');
}
