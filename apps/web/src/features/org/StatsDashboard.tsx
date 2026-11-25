import React, { useEffect, useState } from 'react';
import type { StatsDoc } from '../../firebase/firestore';
import './StatsDashboard.css';

interface StatsDashboardProps {
  load: (days?: number) => Promise<Array<{ date: string } & StatsDoc>>;
}

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ');

/** Admin: counts over time and top categories. Counts only, never content. BRIEF §P1-1. */
export default function StatsDashboard({ load }: StatsDashboardProps): React.JSX.Element {
  const [rows, setRows] = useState<Array<{ date: string } & StatsDoc>>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    load(14).then(setRows).catch(() => setError("We couldn't load the stats."));
  }, [load]);

  const lastWeek = rows.slice(-7);
  const total = lastWeek.reduce((sum, r) => sum + Object.values(r.counts ?? {}).reduce((a, b) => a + (b ?? 0), 0), 0);
  const byCategory = new Map<string, number>();
  for (const r of lastWeek) for (const [c, n] of Object.entries(r.counts ?? {})) byCategory.set(c, (byCategory.get(c) ?? 0) + (n ?? 0));
  const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const max = Math.max(1, ...rows.map((r) => r.requests ?? 0));

  return (
    <div className="stats-dashboard">
      <h3>
        {total} secret{total === 1 ? '' : 's'} stopped this week
        {top.length > 0 && `, mostly ${top.map(([c]) => label(c)).join(', ')}`}.
      </h3>
      {error && <p role="alert">{error}</p>}
      <div className="stats-chart">
        <div className="stats-chart-header">
          <span>Date</span>
          <span>Requests</span>
          <span>Details caught</span>
          <span>Stayed local / cloud / held</span>
        </div>
        {rows.map((row) => (
          <div key={row.date} className="stats-chart-row">
            <span>{row.date}</span>
            <span>
              <span aria-hidden="true">{'▮'.repeat(Math.max(1, Math.round(((row.requests ?? 0) / max) * 10)))}</span> {row.requests ?? 0}
            </span>
            <span>{Object.values(row.counts ?? {}).reduce((a, b) => a + (b ?? 0), 0)}</span>
            <span>
              {row.routes?.LOCAL_ANSWER ?? 0} / {row.routes?.CLOUD_SCRUBBED ?? 0} / {row.routes?.BLOCK ?? 0}
            </span>
          </div>
        ))}
        {rows.length === 0 && !error && <p>No activity yet.</p>}
      </div>
    </div>
  );
}
