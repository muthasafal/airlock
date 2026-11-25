/**
 * Nano Detector
 * Firebase AI Logic wrapper for on-device detection
 */

export { checkAvailability, type NanoAvailability } from './availability.js';
export { initializeDeviceModel } from './init.js';
export { detectWithNano, type NanoDetectionResult, type NanoFinding } from './detection.js';
export { resolveSpans } from './span-resolution.js';
export { chunkText, detectChunked, type Chunk, type ChunkedDetectionResult } from './chunking.js';
export { classifyTask, type TaskType, type Complexity, type TaskClassification } from './classification.js';

/**
 * NanoDetector class implements the Detector interface from @airlock/scrub-engine.
 * To be implemented by nano-detector spec.
 */
export class NanoDetector {
  async detect() {
    throw new Error('not implemented: architecture-skeleton');
  }
}

