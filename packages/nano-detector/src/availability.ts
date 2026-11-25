/**
 * Availability checking for Gemini Nano on-device model.
 * BRIEF §6, §P0-9: Device capability detection.
 */
import { TEXT_IO } from './models.js';

export type NanoAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable';

interface LanguageModelGlobal {
  availability(options?: unknown): Promise<NanoAvailability>;
}

/** The Chrome Prompt API global, when this browser has it. */
export function languageModelApi(): LanguageModelGlobal | undefined {
  return (globalThis as unknown as { LanguageModel?: LanguageModelGlobal }).LanguageModel;
}

/**
 * Checks whether Gemini Nano is available on this device, via the Prompt API's
 * LanguageModel.availability() with the same text-in / text-out options the models use.
 * Returns 'unavailable' when the API is missing (other browsers) or throws.
 */
export async function checkAvailability(): Promise<NanoAvailability> {
  const api = languageModelApi();
  if (!api) return 'unavailable';
  try {
    return await api.availability(TEXT_IO);
  } catch {
    return 'unavailable';
  }
}
