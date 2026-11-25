#!/usr/bin/env node

/**
 * Secret-guard hook entry point. BRIEF §12 (Hooks).
 * Reads the prompt from USER_PROMPT (or stdin when USER_PROMPT is unset), runs the rule
 * detectors from the built scrub engine and exits with code 2 if it finds an API key, JWT,
 * private key, password, Aadhaar, PAN or card number. Airlock's own detector stops secrets
 * being pasted into the coding agent (dogfooding).
 */

import { readFileSync } from 'node:fs';
import { detectRules } from '../dist/index.js';

const BLOCKING = new Set(['API_KEY', 'JWT', 'PRIVATE_KEY', 'PASSWORD', 'AADHAAR', 'PAN', 'CARD']);

let prompt = process.env.USER_PROMPT;
if (prompt === undefined && !process.stdin.isTTY) {
  try {
    prompt = readFileSync(0, 'utf8');
  } catch {
    prompt = '';
  }
}
if (!prompt) process.exit(0);

const hits = detectRules(prompt, { nanoMinConfidence: 0.5 }).filter((f) => BLOCKING.has(f.category));
if (hits.length === 0) process.exit(0);

const kinds = [...new Set(hits.map((h) => h.category.toLowerCase().replace(/_/g, ' ')))];
// Never echo the secret itself: only its kind and position.
process.stderr.write(
  `Airlock secret guard: this prompt contains ${hits.length} secret${hits.length > 1 ? 's' : ''} ` +
    `(${kinds.join(', ')}). Remove ${hits.length > 1 ? 'them' : 'it'} or use a placeholder, then send again.\n`,
);
process.exit(2);
