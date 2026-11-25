import { z } from 'zod';
import type { GenerativeModel } from 'firebase/ai';
import { isTimeout, withTimeout } from './models.js';

/**
 * Zod schemas for Nano structured output validation.
 * BRIEF §8.1 Layer B: Exact JSON schema from the brief.
 */

export const NANO_CATEGORIES = [
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
] as const;

export const NanoFindingSchema = z.object({
  text: z.string().min(1),
  category: z.enum(NANO_CATEGORIES),
  confidence: z.number().min(0).max(1),
});

export const NanoResponseSchema = z.object({
  findings: z.array(NanoFindingSchema),
});

export type NanoFinding = z.infer<typeof NanoFindingSchema>;

/** The exact JSON schema from BRIEF §8.1 Layer B, passed as the Prompt API responseConstraint. */
export const NANO_JSON_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          category: { type: 'string', enum: [...NANO_CATEGORIES] },
          confidence: { type: 'number' },
        },
        required: ['text', 'category', 'confidence'],
      },
    },
  },
  required: ['findings'],
} as const;

/** The short, strict system instruction from BRIEF §8.1 Layer B. */
export const NANO_SYSTEM_PROMPT =
  'You are a privacy filter. List every span that identifies a person, organisation, private place, ' +
  'health condition, money amount tied to a person or company, legal matter, internal project or credential. ' +
  'Copy each span exactly as written. Do not explain.';

export interface NanoDetectionResult {
  findings: NanoFinding[];
  timedOut: boolean;
  /** "on_device" when Gemini Nano answered (always, since the model is ONLY_ON_DEVICE). */
  inferenceSource?: string;
}

/**
 * Parses and validates Nano's JSON with zod. Model output is untrusted: anything invalid is
 * dropped item by item instead of failing the whole response. BRIEF §11.3.
 */
export function parseNanoJson(raw: string): NanoFinding[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return [];
    try {
      data = JSON.parse(m[0]);
    } catch {
      return [];
    }
  }
  const items = (data as { findings?: unknown })?.findings;
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    const r = NanoFindingSchema.safeParse(item);
    return r.success ? [r.data] : [];
  });
}

/**
 * Runs Nano detection with ONLY_ON_DEVICE and the BRIEF §8.1 Layer B system prompt.
 * Validates response with Zod. Times out at 8 s and sets timedOut = true. BRIEF §8.1 Layer B.
 */
export async function detectWithNano(model: GenerativeModel, text: string, timeoutMs = 8000): Promise<NanoDetectionResult> {
  try {
    const result = await withTimeout(model.generateContent(text), timeoutMs);
    return {
      findings: parseNanoJson(result.response.text()),
      timedOut: false,
      inferenceSource: result.response.inferenceSource,
    };
  } catch (e) {
    if (isTimeout(e)) return { findings: [], timedOut: true };
    throw e;
  }
}
