import { Policy } from '@airlock/scrub-engine';

interface PolicyEditorProps {
  policy: Policy;
  onSave: (p: Policy) => void;
}

/**
 * Editor for org category policies (admin only). BRIEF §P1-1.
 */
export default function PolicyEditor(_props: PolicyEditorProps): React.JSX.Element {
  throw new Error('not implemented: architecture-skeleton');
}
