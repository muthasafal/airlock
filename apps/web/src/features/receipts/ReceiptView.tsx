import React from 'react';
import './ReceiptView.css';

interface Receipt {
  id: string;
  timestamp: Date;
  route: 'CLOUD_SCRUBBED' | 'LOCAL_ANSWER' | 'BLOCK';
  outbound: string | null;
  findings: number;
  categories: string[];
}

interface ReceiptViewProps {
  receipt: Receipt;
}

/**
 * Shows one receipt: "What left your device" diff, export, clear.
 * BRIEF §P0-7.
 * // TODO(receipt-view): export JSON, implement clear
 */
export default function ReceiptView({ receipt }: ReceiptViewProps): React.JSX.Element {
  const handleExport = () => {
    const json = JSON.stringify(receipt, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Delete this receipt?')) {
      // TODO(receipt-view): call forget(receipt.id)
      alert('TODO: Delete receipt');
    }
  };

  return (
    <div className="receipt-view">
      <div className="receipt-view-header">
        <h2>What left your device</h2>
        <div className="receipt-view-actions">
          <button className="receipt-view-action-button" onClick={handleExport} title="Download as JSON">
            ↓ JSON
          </button>
          <button className="receipt-view-action-button" onClick={handleClear} title="Delete receipt">
            ✕ Clear
          </button>
        </div>
      </div>

      <div className="receipt-view-metadata">
        <div className="receipt-metadata-row">
          <span className="receipt-metadata-label">Time:</span>
          <span>{receipt.timestamp.toLocaleString()}</span>
        </div>
        <div className="receipt-metadata-row">
          <span className="receipt-metadata-label">Route:</span>
          <span>
            {receipt.route === 'CLOUD_SCRUBBED' && '☁ Cloud (scrubbed)'}
            {receipt.route === 'LOCAL_ANSWER' && '🏠 Local only'}
            {receipt.route === 'BLOCK' && '🛑 Blocked'}
          </span>
        </div>
        <div className="receipt-metadata-row">
          <span className="receipt-metadata-label">Findings:</span>
          <span>{receipt.findings} secrets detected</span>
        </div>
        <div className="receipt-metadata-row">
          <span className="receipt-metadata-label">Categories:</span>
          <span>{receipt.categories.join(', ')}</span>
        </div>
      </div>

      {receipt.outbound && (
        <div className="receipt-view-payload">
          <h3>Outbound text</h3>
          <div className="receipt-view-payload-text">
            {receipt.outbound}
          </div>
        </div>
      )}

      {receipt.route === 'BLOCK' && (
        <div className="receipt-view-blocked">
          <p>This request was blocked and did not leave your device.</p>
        </div>
      )}
    </div>
  );
}
