import { getGenerativeModel, InferenceMode, type AI, type GenerativeModel } from 'firebase/ai';
import { NANO_JSON_SCHEMA, NANO_SYSTEM_PROMPT } from './detection.js';
import { CLASSIFY_JSON_SCHEMA, CLASSIFY_SYSTEM_PROMPT } from './classification.js';

/**
 * Firebase AI Logic hybrid models used by Airlock (BRIEF §6, §8.1 Layer B, §8.4).
 * Option names checked against the installed firebase 13.4 typings: HybridParams { mode,
 * onDeviceParams: { createOptions, promptOptions: { responseConstraint } }, inCloudParams }.
 * Raw (unscrubbed) text only ever goes to ONLY_ON_DEVICE models.
 */

/** English text in, English text out: the on-device Prompt API session options. */
export const TEXT_IO = {
  expectedInputs: [{ type: 'text' as const, languages: ['en'] }],
  expectedOutputs: [{ type: 'text' as const, languages: ['en'] }],
};

export interface NanoModels {
  /** ONLY_ON_DEVICE, structured output with the BRIEF §8.1 findings schema. */
  detect: GenerativeModel;
  /** ONLY_ON_DEVICE, structured output with the BRIEF §8.4 task enum. */
  classify: GenerativeModel;
  /** ONLY_ON_DEVICE, free text: LOCAL_ANSWER on the original text, which never leaves the device. */
  answer: GenerativeModel;
}

/** Creates the three on-device models from an AI Logic instance (App Check is set up by the caller). */
export function createNanoModels(ai: AI, cloudModel = 'gemini-3.5-flash-lite'): NanoModels {
  const onDevice = (system: string, responseConstraint?: object) =>
    getGenerativeModel(ai, {
      mode: InferenceMode.ONLY_ON_DEVICE,
      onDeviceParams: {
        createOptions: { ...TEXT_IO, initialPrompts: [{ role: 'system', content: [{ type: 'text', value: system }] }] },
        ...(responseConstraint ? { promptOptions: { responseConstraint } } : {}),
      },
      // Never used in ONLY_ON_DEVICE mode; kept so the config is complete and explicit.
      inCloudParams: { model: cloudModel },
    });
  return {
    detect: onDevice(NANO_SYSTEM_PROMPT, NANO_JSON_SCHEMA),
    classify: onDevice(CLASSIFY_SYSTEM_PROMPT, CLASSIFY_JSON_SCHEMA),
    answer: onDevice(
      'You are a helpful writing assistant running privately on this device. Answer concisely in plain English.',
    ),
  };
}

/** Rejects after `ms` milliseconds with a TimeoutError, so callers can mark protection as Reduced. */
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`Timed out after ${ms} ms`), { name: 'TimeoutError' })), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

export const isTimeout = (e: unknown) => e instanceof Error && e.name === 'TimeoutError';
