import { NanoAvailability } from '@airlock/nano-detector';

export interface ProtectionStatusHook {
  availability: NanoAvailability;
  initProgress: number | null;
  startInit: () => void;
}

/**
 * Hook for Nano availability and initialization status.
 * Returns availability, progress % (0-100), and startInit callback.
 * BRIEF §P0-9.
 */
export function useProtectionStatus(): ProtectionStatusHook {
  throw new Error('not implemented: architecture-skeleton');
}
