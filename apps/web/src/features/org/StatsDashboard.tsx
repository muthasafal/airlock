import React from 'react';
import { DEMO_ORG_STATS } from '../chat/fixtures';
import './StatsDashboard.css';

export default function StatsDashboard(): React.JSX.Element {
  return (
    <div className="stats-dashboard">
      <h3>Secrets detected this week</h3>
      <div className="stats-chart">
        <div className="stats-chart-header">
          <span>Date</span>
          <span>Person</span>
          <span>Org</span>
          <span>Credential</span>
        </div>
        {DEMO_ORG_STATS.map((row) => (
          <div key={row.date} className="stats-chart-row">
            <span>{row.date}</span>
            <span>{row.person}</span>
            <span>{row.org}</span>
            <span>{row.credential}</span>
          </div>
        ))}
      </div>
      {/* TODO(stats-dashboard): implement real chart visualization */}
    </div>
  );
}
