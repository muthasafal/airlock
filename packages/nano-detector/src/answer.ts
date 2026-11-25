import type { GenerativeModel } from 'firebase/ai';

/**
 * LOCAL_ANSWER (BRIEF §8.4): answers on the ORIGINAL text with the ONLY_ON_DEVICE model, so
 * nothing leaves the device. Streams text chunks to onChunk and returns the full answer plus
 * the SDK's inferenceSource for the receipt.
 */
export async function answerOnDevice(
  model: GenerativeModel,
  prompt: string,
  onChunk?: (text: string) => void,
): Promise<{ text: string; inferenceSource?: string }> {
  const result = await model.generateContentStream(prompt);
  let text = '';
  let source: string | undefined;
  for await (const chunk of result.stream) {
    const t = chunk.text();
    source ??= chunk.inferenceSource;
    if (t) {
      text += t;
      onChunk?.(t);
    }
  }
  const final = await result.response;
  return { text, inferenceSource: final.inferenceSource ?? source };
}
