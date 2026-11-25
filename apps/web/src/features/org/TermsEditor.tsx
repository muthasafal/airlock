import { OrgDoc } from '../../firebase/firestore';

interface TermsEditorProps {
  terms: OrgDoc['protectedTerms'];
  onSave: (t: OrgDoc['protectedTerms']) => void;
}

/**
 * Editor for org protected terms (admin only). BRIEF §P1-1.
 */
export default function TermsEditor(_props: TermsEditorProps): React.JSX.Element {
  throw new Error('not implemented: architecture-skeleton');
}
