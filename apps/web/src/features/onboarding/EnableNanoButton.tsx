import React from 'react';
import { motion } from 'framer-motion';
import { DURATION_NORMAL } from '../../lib/motion';
import './EnableNanoButton.css';

interface EnableNanoButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Button to trigger on-device model download.
 * User gesture required per BRIEF §6.
 * // TODO(enable-nano): call model.initializeDeviceModel() on click
 */
export default function EnableNanoButton({ onClick, disabled = false, loading = false }: EnableNanoButtonProps): React.JSX.Element {
  return (
    <button
      className="enable-nano-button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      title="Initialize the on-device AI model for maximum protection"
    >
      {loading ? (
        <>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: DURATION_NORMAL, repeat: Infinity, ease: 'linear' }}
            className="enable-nano-spinner"
          >
            ⟳
          </motion.span>
          <span>Initializing...</span>
        </>
      ) : (
        <>
          <span className="enable-nano-icon">↓</span>
          <span>Enable on-device protection</span>
        </>
      )}
    </button>
  );
}
