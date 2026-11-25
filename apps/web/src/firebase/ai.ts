import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode, type AI, type GenerativeModel } from 'firebase/ai';
import { createNanoModels, type NanoModels } from '@airlock/nano-detector';
import { app } from './init';
import { initAppCheck } from './appCheck';
import { getCloudModel } from './remoteConfig';

/**
 * Firebase AI Logic (hybrid inference) for Airlock. BRIEF §6, §9.
 * - On-device models (Gemini Nano, ONLY_ON_DEVICE) see raw text: detection, task
 *   classification and LOCAL_ANSWER. They are created in @airlock/nano-detector.
 * - The cloud model (ONLY_IN_CLOUD) only ever receives scrubbed text, via lib/cloud-client.
 * App Check is initialised before the first AI Logic call.
 */
let ai: AI | null = null;
let nano: NanoModels | null = null;

export function getAirlockAI(): AI | null {
  if (!app) return null;
  if (!ai) {
    initAppCheck(app);
    ai = getAI(app, { backend: new GoogleAIBackend() });
  }
  return ai;
}

/** The on-device models, or null when Firebase is not configured. */
export function getNanoModels(): NanoModels | null {
  const instance = getAirlockAI();
  if (!instance) return null;
  nano ??= createNanoModels(instance, getCloudModel());
  return nano;
}

/** A cloud-only model for scrubbed text (BRIEF §8.4 CLOUD_SCRUBBED). Model names come from Remote Config. */
export function getCloudGenerativeModel(model: string): GenerativeModel | null {
  const instance = getAirlockAI();
  if (!instance) return null;
  return getGenerativeModel(instance, {
    mode: InferenceMode.ONLY_IN_CLOUD,
    inCloudParams: {
      model,
      systemInstruction:
        'You are a helpful assistant. Some names, organisations and numbers in the text are realistic ' +
        'placeholders; use them exactly as written. Text like ‹secret-1› marks a withheld secret: refer ' +
        'to it by that label and never guess its value.',
    },
  });
}
