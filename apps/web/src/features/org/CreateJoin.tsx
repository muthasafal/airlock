interface CreateJoinProps {
  onCreateOrg: (name: string) => void;
  onJoinOrg: (code: string) => void;
}

/**
 * Form to create an org or join via invite code. BRIEF §P1-1.
 */
export default function CreateJoin(_props: CreateJoinProps): React.JSX.Element {
  throw new Error('not implemented: architecture-skeleton');
}
