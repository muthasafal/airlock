import { RouterDecision, RouteDecision } from '../../lib/router';

interface RoutePickerProps {
  decision: RouterDecision;
  onOverride: (r: RouteDecision) => void;
}

/**
 * Shows the router decision with plain-English reason.
 * Allows user to override (force "local only" or "use cloud"). BRIEF §8.4.
 */
export default function RoutePicker(_props: RoutePickerProps): React.JSX.Element {
  throw new Error('not implemented: architecture-skeleton');
}
