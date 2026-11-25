import { Finding as _Finding } from '@airlock/scrub-engine';
import { NanoFinding } from './span-resolution';

/**
 * Text chunking for multi-chunk Nano detection.
 * BRIEF §8.1 Layer B: Chunking, 4000 chars, 200 overlap.
 */

export interface Chunk {
  text: string;
  offset: number;
}

export interface ChunkedDetectionResult {
  findings: NanoFinding[];
  timedOut: boolean;
  chunksProcessed: number;
}

/**
 * Splits text into chunks at paragraph boundaries.
 * Defaults: chunkSize = 4000, overlap = 200.
 */
export function chunkText(_text: string, _chunkSize?: number, _overlap?: number): Chunk[] {
  throw new Error('not implemented: architecture-skeleton');
}

/**
 * Runs detection across all chunks sequentially.
 * Reports progress via onProgress(0..100). BRIEF §8.1 Layer B.
 */
export async function detectChunked(
  _text: string,
  _onProgress?: (pct: number) => void,
): Promise<ChunkedDetectionResult> {
  throw new Error('not implemented: architecture-skeleton');
}
