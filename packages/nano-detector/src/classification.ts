import { z } from 'zod';
import type { GenerativeModel } from 'firebase/ai';
import { withTimeout } from './models.js';

/**
 * Task classification for the hybrid router.
 * BRIEF §8.4: Step 1 of the router decision.
 */

export const TASK_TYPES = ['REWRITE', 'SUMMARIZE_SHORT', 'TRANSLATE_SHORT', 'QA_ON_TEXT', 'REASONING', 'CODE', 'CREATIVE_LONG', 'OTHER'] as const;
export const COMPLEXITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type TaskType = (typeof TASK_TYPES)[number];
export type Complexity = (typeof COMPLEXITIES)[number];

export interface TaskClassification {
  task: TaskType;
  complexity: Complexity;
}

const ClassificationSchema = z.object({ task: z.enum(TASK_TYPES), complexity: z.enum(COMPLEXITIES) });

/** BRIEF §8.4 enum schema, used as the on-device responseConstraint. */
export const CLASSIFY_JSON_SCHEMA = {
  type: 'object',
  properties: {
    task: { type: 'string', enum: [...TASK_TYPES] },
    complexity: { type: 'string', enum: [...COMPLEXITIES] },
  },
  required: ['task', 'complexity'],
} as const;

export const CLASSIFY_SYSTEM_PROMPT =
  'Classify the user request. task is one of REWRITE, SUMMARIZE_SHORT, TRANSLATE_SHORT, QA_ON_TEXT, ' +
  'REASONING, CODE, CREATIVE_LONG, OTHER. complexity is LOW, MEDIUM or HIGH. Answer with JSON only.';

/** What the router assumes when classification fails: send it to the cloud (safe, already scrubbed). */
export const FALLBACK_CLASSIFICATION: TaskClassification = { task: 'OTHER', complexity: 'HIGH' };

/**
 * Classifies the task type and complexity using ONLY_ON_DEVICE structured output on the
 * scrubbed text. Used by the hybrid router (Step 1 of BRIEF §8.4). Never throws: any failure
 * returns FALLBACK_CLASSIFICATION.
 */
export async function classifyTask(model: GenerativeModel, scrubbedText: string, timeoutMs = 8000): Promise<TaskClassification> {
  try {
    const result = await withTimeout(model.generateContent(scrubbedText.slice(0, 6000)), timeoutMs);
    const parsed = ClassificationSchema.safeParse(JSON.parse(result.response.text()));
    return parsed.success ? parsed.data : FALLBACK_CLASSIFICATION;
  } catch {
    return FALLBACK_CLASSIFICATION;
  }
}
