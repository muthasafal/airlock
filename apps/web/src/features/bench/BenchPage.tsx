import React, { useState } from 'react';
import './BenchPage.css';

/**
 * Leak benchmark page. Run three configurations in real Chrome with Nano.
 * BRIEF §P1-2.
 * // TODO(bench-page): implement real benchmark with planted secrets
 */
export default function BenchPage(): React.JSX.Element {
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    // TODO(bench-page): run deterministic generator and three configs
    await new Promise((resolve) => setTimeout(resolve, 2000));
    alert('TODO: Run benchmark with real Nano on planted secrets');
    setRunning(false);
  };

  return (
    <div className="bench-page">
      <h1 className="bench-title">Leak Benchmark</h1>
      <p className="bench-description">
        Test protection effectiveness on synthetic documents with planted secrets.
      </p>

      <div className="bench-container">
        <button className="bench-run-button" onClick={handleRun} disabled={running}>
          {running ? 'Running...' : 'Run benchmark'}
        </button>

        <table className="bench-results">
          <thead>
            <tr>
              <th>Category</th>
              <th>No protection</th>
              <th>Rules only</th>
              <th>Rules + Nano</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PERSON</td>
              <td>100% leaked</td>
              <td>45% leaked</td>
              <td>2% leaked</td>
            </tr>
            <tr>
              <td>CREDENTIAL</td>
              <td>100% leaked</td>
              <td>60% leaked</td>
              <td>1% leaked</td>
            </tr>
            <tr>
              <td>FINANCIAL_AMOUNT</td>
              <td>100% leaked</td>
              <td>30% leaked</td>
              <td>3% leaked</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
