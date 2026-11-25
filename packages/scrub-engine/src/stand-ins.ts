import { StandInGenerator } from './types';

/**
 * Creates a seeded stand-in generator. Seed is stored in the vault per session.
 * Uses mulberry32 PRNG. Pools are loaded from src/pools/*.json.
 * Implements mapping rules from BRIEF §8.2: region detection, aliases, collision check.
 */
export function createStandInGenerator(_seed: number): StandInGenerator {
  throw new Error('not implemented: architecture-skeleton');
}
