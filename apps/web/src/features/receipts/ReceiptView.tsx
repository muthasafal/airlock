import React from 'react';
import type { Receipt } from '../../lib/receipts';
import './ReceiptView.css';

interface ReceiptViewProps {
  receipt: Receipt;
  /** The original side of the diff, rebuilt on this device from the vault (null if forgotten). */
  original?: string | null;
  onDelete?: () => void;
}

const ROUTE_LABEL = {
  CLOUD_SCRUBBED: 'Cleaned text went to the cloud',
  LOCAL_ANSWER: 'Stayed on your device',
  BLOCK: 'Held back, nothing was sent',
} as const;

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ');

/**
 * Shows one receipt: the "What left your device" diff (originals left, sent text right),
 * route and reason, inferenceSource per step, counts by category, detectors and protection.
 * BRIEF §P0-7.
 */
export default function ReceiptView({ receipt, original, onDelete }: ReceiptViewProps): React.JSX.Element {
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const counts = Object.entries(receipt.categoryCounts).filter(([, n]) => (n ?? 0) > 0);

  return (
    <div className="receipt-view">
      <div className="receipt-view-header">
        <h2>What left your device</h2>
        <div className="receipt-view-actions">
          <button className="receipt-view-action-button" onClick={handleExport} title="Download as JSON">
            Export JSON
          </button>
          {onDelete && (
            <button className="receipt-view-action-button" onClick={onDelete} title="Delete receipt">
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="receipt-view-metadata">
        <div className="receipt-metadata-row">
          <span className="receipt-metadata-label">Time:</span>
          <span>{new Date(receipt.timestamp).toLocaleString()}</span>
        </div>
        <div className="receipt-metadata-row">
          <span className="receipt-metadata-label">Route:</span>
          <span>{ROUTE_LABEL[receipt.routeDecision]}</span>
        </div>
        <div className="receipt-metadata-row">
          <span className="receipt-metadata-label">Why:</span>
          <span>{receipt.routeReason}</span>
        </div>
        <div className="receipt-metadata-row">
          <span className="receipt-metadata-label">Where each step ran:</span>
          <span>
            {Object.entries(receipt.inferenceSource)
              .map(([step, src]) => `${step}: ${src}`)
              .join(', ')}
          </span>
        </div>
        {receipt.model && (
          <div className="receipt-metadata-row">
            <span className="receipt-metadata-label">Cloud model:</span>
            <span>{receipt.model}</span>
          </div>
        )}
        <div className="receipt-metadata-row">
          <span className="receipt-metadata-label">Found:</span>
          <span>{counts.length ? counts.map(([c, n]) => `${n} ${label(c)}`).join(', ') : 'nothing sensitive'}</span>
        </div>
        {receipt.withheldSecrets > 0 && (
          <div className="receipt-metadata-row">
            <span className="receipt-metadata-label">Withheld:</span>
            <span>
              {receipt.withheldSecrets} secret{receipt.withheldSecrets === 1 ? '' : 's'}
            </span>
          </div>
        )}
        <div className="receipt-metadata-row">
          <span className="receipt-metadata-label">Detectors:</span>
          <span>{receipt.detectorsUsed.map((d) => (d === 'NANO' ? 'Gemini Nano (on-device)' : 'rule checks')).join(' and ')}</span>
        </div>
        <div className="receipt-metadata-row">
          <span className="receipt-metadata-label">Protection:</span>
          <span>{receipt.protectionLevel}</span>
        </div>
      </div>

      {receipt.outboundPayload && (
        <div className="receipt-view-payload">
          <h3>On your device</h3>
          <div className="receipt-view-payload-text">
            {original ?? 'The originals for this receipt were forgotten with their session.'}
          </div>
          <h3>What was sent</h3>
          <div className="receipt-view-payload-text">{receipt.outboundPayload}</div>
        </div>
      )}

      {receipt.routeDecision === 'LOCAL_ANSWER' && (
        <div className="receipt-view-blocked">
          <p>This message was answered by the private model on your device. Nothing was sent.</p>
        </div>
      )}
      {receipt.routeDecision === 'BLOCK' && (
        <div className="receipt-view-blocked">
          <p>This request was held back and did not leave your device.</p>
        </div>
      )}
    </div>
  );
}
