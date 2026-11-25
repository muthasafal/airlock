/**
 * Availability checking for Gemini Nano on-device model.
 * BRIEF §6, §P0-9: Device capability detection.
 */

export type NanoAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable';

/**
 * Checks whether Gemini Nano is available on this device.
 * Wraps LanguageModel.availability() from the Firebase AI SDK.
 * Returns one of: 'available', 'downloadable', 'downloading', 'unavailable'.
 */
export async function checkAvailability(): Promise<NanoAvailability> {
  throw new Error('not implemented: architecture-skeleton');
}
