/** The AI chat sites Airlock runs on (integrations R7.1). */
export const AI_SITES = [
  'chatgpt.com',
  'chat.openai.com',
  'claude.ai',
  'gemini.google.com',
  'copilot.microsoft.com',
  'www.perplexity.ai',
  'chat.deepseek.com',
];

export type Msg =
  | { type: 'clean'; text: string }
  | { type: 'status' }
  | { type: 'forget' };

export interface CleanReply {
  text: string;
  changed: number;
  withheld: number;
  detection: 'rules + Gemini Nano' | 'rules only';
}

export interface StatusReply {
  nano: string;
}
