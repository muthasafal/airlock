import { ScrubResult, Detector, SessionMapping, Policy } from './types';

/**
 * Entry point: runs detectors, merges findings (Layer C), applies policy,
 * generates stand-ins, and returns the scrubbed text with the updated mapping.
 * BRIEF §8.1–8.3.
 */
export async function scrub(
  _text: string,
  _detectors: Detector[],
  _mapping: SessionMapping,
  _policy: Policy,
): Promise<ScrubResult> {
  throw new Error('not implemented: architecture-skeleton');
}
