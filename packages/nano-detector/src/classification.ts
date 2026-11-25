/**
 * Task classification for the hybrid router.
 * BRIEF §8.4: Step 1 of the router decision.
 */

export type TaskType =
  | 'REWRITE'
  | 'SUMMARIZE_SHORT'
  | 'TRANSLATE_SHORT'
  | 'QA_ON_TEXT'
  | 'REASONING'
  | 'CODE'
  | 'CREATIVE_LONG'
  | 'OTHER';

export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskClassification {
  task: TaskType;
  complexity: Complexity;
}

/**
 * Classifies the task type and complexity using ONLY_ON_DEVICE structured output.
 * Used by the hybrid router (Step 1 of BRIEF §8.4).
 */
export async function classifyTask(_text: string): Promise<TaskClassification> {
  throw new Error('not implemented: architecture-skeleton');
}
