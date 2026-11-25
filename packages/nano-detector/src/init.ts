/**
 * Triggers Gemini Nano download after a user gesture.
 * BRIEF §6: initializeDeviceModel() requires user gesture.
 */

/**
 * Triggers Gemini Nano download. Calls model.initializeDeviceModel().
 * Reports progress via onProgress(0..100).
 * Must be called after a user gesture (button click, etc.).
 */
export async function initializeDeviceModel(_onProgress?: (pct: number) => void): Promise<void> {
  throw new Error('not implemented: architecture-skeleton');
}
