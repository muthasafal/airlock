import React, { useState } from 'react';
import { lastReport, runBenchmark, type BenchReport, type ConfigResult } from '../../lib/bench';
import './BenchPage.css';

const pct = (x: number | null) => (x === null ? 'n/a' : `${Math.round(x * 100)}%`);
const label = (s: string) => s.toLowerCase().replace(/_/g, ' ');
const CONFIG_LABEL = { none: 'No protection', rules: 'Rules only', 'rules+nano': 'Rules + Nano' } as const;

/**
 * Leak benchmark page. Runs three configurations in this browser on seeded synthetic documents
 * with planted (fictional) secrets: no protection, rules only, rules + Gemini Nano.
 * BRIEF §P1-2. Lazy-loaded route.
 */
export default function BenchPage(): React.JSX.Element {
  const [report, setReport] = useState<BenchReport | null>(() => lastReport());
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [docs, setDocs] = useState(60);
  const [seed, setSeed] = useState(2026);

  const handleRun = async () => {
    setRunning(true);
    try {
      setReport(await runBenchmark(docs, seed, (cfg, done) => setProgress(`${CONFIG_LABEL[cfg as keyof typeof CONFIG_LABEL]}: ${done} of ${docs}`)));
    } finally {
      setRunning(false);
      setProgress('');
    }
  };

  const download = () => {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `airlock-bench-seed${report.seed}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const byConfig = (c: string) => report?.results.find((r) => r.config === c);
  const categories = [...new Set(report?.results.flatMap((r) => r.categories.map((x) => x.category)) ?? [])].sort();
  const cell = (r: ConfigResult | undefined, cat: string) => {
    if (!r) return '';
    if (!r.available) return 'not available here';
    const c = r.categories.find((x) => x.category === cat);
    return c ? `${c.leaked} of ${c.planted} leaked, recall ${pct(c.recall)}${r.config === 'none' ? '' : `, precision ${pct(c.precision)}`}` : '';
  };

  return (
    <div className="bench-page">
      <h1 className="bench-title">Leak Benchmark</h1>
      <p className="bench-description">
        We generate synthetic documents (emails, chats, code, medical notes, contracts) with planted, fictional secrets, then count what each setup lets
        through. Everything runs in this browser; nothing is sent anywhere.
      </p>

      <div className="bench-container">
        <label>
          Documents{' '}
          <input type="number" min={6} max={500} value={docs} onChange={(e) => setDocs(Math.min(500, Math.max(6, Number(e.target.value) || 60)))} />
        </label>{' '}
        <label>
          Seed <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 1)} />
        </label>
        <button className="bench-run-button" onClick={() => void handleRun()} disabled={running}>
          {running ? 'Running...' : 'Run benchmark'}
        </button>
        <p className="bench-description" role="status" aria-live="polite">
          {progress}
        </p>

        {report && (
          <>
            <p className="bench-description">
              Seed {report.seed}, {report.documents} documents, run {new Date(report.ranAt).toLocaleString()}.{' '}
              {report.results
                .filter((r) => r.available)
                .map((r) => `${CONFIG_LABEL[r.config]}: ${r.totalLeaked} of ${r.totalPlanted} leaked, ${r.avgLatencyMs.toFixed(1)} ms per document`)
                .join('. ')}
              .
            </p>
            <button className="bench-run-button" onClick={download}>
              Download results as JSON
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
                {categories.map((cat) => (
                  <tr key={cat}>
                    <td>{label(cat)}</td>
                    <td>{cell(byConfig('none'), cat)}</td>
                    <td>{cell(byConfig('rules'), cat)}</td>
                    <td>{cell(byConfig('rules+nano'), cat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
