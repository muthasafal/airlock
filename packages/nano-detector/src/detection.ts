import { z } from 'zod';

/**
 * Zod schemas for Nano structured output validation.
 * BRIEF §8.1 Layer B: Exact JSON schema from the brief.
 */

export const NanoFindingSchema = z.object({
  text: z.string(),
  category: z.enum([
    'PERSON',
    'ORG',
    'LOCATION',
    'HEALTH',
    'FINANCIAL_AMOUNT',
    'LEGAL_MATTER',
    'INTERNAL_PROJECT',
    'CREDENTIAL',
    'GOVERNMENT_ID',
    'DATE_OF_BIRTH',
    'OTHER_SENSITIVE',
  ]),
  confidence: z.number().min(0).max(1),
});

export const NanoResponseSchema = z.object({
  findings: z.array(NanoFindingSchema),
});

export type NanoFinding = z.infer<typeof NanoFindingSchema>;

export interface NanoDetectionResult {
  findings: NanoFinding[];
  timedOut: boolean;
}

/**
 * Runs Nano detection with ONLY_ON_DEVICE and the BRIEF §8.1 Layer B system prompt.
 * Validates response with Zod. Times out at 8 s and sets timedOut = true. BRIEF §8.1 Layer B.
 */
export async function detectWithNano(_text: string): Promise<NanoDetectionResult> {
  throw new Error('not implemented: architecture-skeleton');
}
