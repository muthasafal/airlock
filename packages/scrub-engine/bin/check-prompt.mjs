#!/usr/bin/env node

/**
 * Secret-guard hook entry point. BRIEF §12 (Hooks).
 * Reads USER_PROMPT from env, runs rule-only detectors, exits 2 if any BLOCK/PSEUDONYMIZE
 * finding is found. Used as the secret-guard Kiro hook.
 */

/* eslint-disable no-undef */
const userPrompt = process.env.USER_PROMPT;
if (!userPrompt) {
  process.exit(0);
}

throw new Error('not implemented: architecture-skeleton');
