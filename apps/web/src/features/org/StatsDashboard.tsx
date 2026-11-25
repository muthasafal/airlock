import { StatsDoc } from '../../firebase/firestore';

interface StatsDashboardProps {
  stats: StatsDoc[];
}

/**
 * Admin stats dashboard: counts over time, top categories, aggregate metrics.
 * Counts only, never content. BRIEF §P1-1.
 */
export default function StatsDashboard(_props: StatsDashboardProps): React.JSX.Element {
  throw new Error('not implemented: architecture-skeleton');
}
