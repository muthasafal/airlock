import { Finding } from '@airlock/scrub-engine';

interface ComposerProps {
  onSubmit: (text: string) => void;
  onPreviewChange: (findings: Finding[]) => void;
  disabled?: boolean;
}

/**
 * Text input with live redaction preview (debounced 300ms).
 * Rules run instantly, then Nano refines. BRIEF §P0-6.
 * Shows sensitive spans highlighted inline.
 */
export default function Composer(_props: ComposerProps): React.JSX.Element {
  throw new Error('not implemented: architecture-skeleton');
}
