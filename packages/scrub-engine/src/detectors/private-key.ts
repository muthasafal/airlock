import type { DetectorConfig, Finding } from '../types.js';
import { matchAll } from './util.js';

const PEM = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$(?![\s\S]))/g;

/** PEM private key blocks from the BEGIN marker to the END marker (or end of text). BRIEF §8.1 PRIVATE_KEY. */
export function detectPrivateKey(text: string, _config?: DetectorConfig): Finding[] {
  return matchAll(text, PEM, 'PRIVATE_KEY');
}
