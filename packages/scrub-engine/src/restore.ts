import { RestoreResult, SessionMapping, StreamingRestoreBuffer } from './types';

/**
 * Restores stand-ins to originals in a model answer. Handles:
 * - case variants (Maya → maya, MAYA)
 * - possessives (Maya's → Priya's)
 * - first-name/surname aliases
 * - titles ("Ms. Iyer")
 * BRIEF §8.5.
 */
export function restore(_text: string, _mapping: SessionMapping): RestoreResult {
  throw new Error('not implemented: architecture-skeleton');
}

/**
 * Creates a streaming restore buffer. Holds a tail of maxStandInLength characters,
 * emitting text only when it cannot be the prefix of a stand-in. Avoids splitting
 * stand-ins across chunk boundaries. BRIEF §8.5.
 */
export function createStreamingRestoreBuffer(
  _mapping: SessionMapping,
  _maxStandInLength: number,
): StreamingRestoreBuffer {
  throw new Error('not implemented: architecture-skeleton');
}
