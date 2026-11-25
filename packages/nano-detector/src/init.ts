/**
 * Triggers Gemini Nano download after a user gesture.
 * BRIEF §6: initializeDeviceModel() requires user gesture.
 */
import type { GenerativeModel } from 'firebase/ai';

/**
 * Triggers the Gemini Nano download through Firebase AI Logic's GenerativeModel.initializeDeviceModel().
 * Reports progress via onProgress(0..100). Must be called from a user gesture (a button click),
 * because Chrome only starts a model download after user activation.
 */
export async function initializeDeviceModel(model: GenerativeModel, onProgress?: (pct: number) => void): Promise<void> {
  await model.initializeDeviceModel((value: number) => onProgress?.(Math.round(Math.min(1, Math.max(0, value)) * 100)));
}
