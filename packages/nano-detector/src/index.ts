/**
 * Nano Detector
 * Firebase AI Logic wrapper for on-device detection (BRIEF §8.1 Layer B), task classification
 * (§8.4) and on-device answers. Implements the scrub-engine Detector interface.
 */
import type { Detector, DetectorConfig, Finding } from '@airlock/scrub-engine';
import type { GenerativeModel } from 'firebase/ai';
import { detectChunked } from './chunking.js';

export { checkAvailability, languageModelApi, type NanoAvailability } from './availability.js';
export { initializeDeviceModel } from './init.js';
export {
  detectWithNano, parseNanoJson, NANO_JSON_SCHEMA, NANO_SYSTEM_PROMPT, NANO_CATEGORIES,
  type NanoDetectionResult, type NanoFinding,
} from './detection.js';
export { resolveSpans } from './span-resolution.js';
export { chunkText, detectChunked, type Chunk, type ChunkedDetectionResult } from './chunking.js';
export {
  classifyTask, FALLBACK_CLASSIFICATION, TASK_TYPES, COMPLEXITIES,
  type TaskType, type Complexity, type TaskClassification,
} from './classification.js';
export { answerOnDevice } from './answer.js';
export { createNanoModels, withTimeout, TEXT_IO, type NanoModels } from './models.js';

export interface NanoDetectorOptions {
  chunkChars?: number;
  overlap?: number;
  timeoutMs?: number;
  onProgress?: (pct: number) => void;
}

/**
 * Layer B detector: Gemini Nano via Firebase AI Logic (ONLY_ON_DEVICE). Implements the
 * scrub-engine Detector interface. A chunk timeout does not throw: the findings found so far
 * are returned and `lastTimedOut` is set, so the caller marks protection as Reduced.
 * Errors (model unavailable) throw, and scrub() counts the detector as failed.
 */
export class NanoDetector implements Detector {
  lastTimedOut = false;

  constructor(
    private readonly model: GenerativeModel,
    private readonly options: NanoDetectorOptions = {},
  ) {}

  async detect(text: string, _config: DetectorConfig): Promise<Finding[]> {
    const r = await detectChunked(this.model, text, this.options);
    this.lastTimedOut = r.timedOut;
    return r.findings;
  }
}
