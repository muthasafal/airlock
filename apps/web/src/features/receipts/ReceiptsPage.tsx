import React, { useState } from 'react';
import ReceiptView from './ReceiptView';
import { DEMO_RECEIPTS } from '../chat/fixtures';
import './ReceiptsPage.css';

/**
 * Receipts page showing all requests and their what-left-your-device details.
 * BRIEF §P0-7.
 */
export default function ReceiptsPage(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedReceipt = selectedId ? DEMO_RECEIPTS.find((r) => r.id === selectedId) : null;

  return (
    <div className="receipts-page">
      <h1 className="receipts-title">Receipts</h1>
      <p className="receipts-description">
        Every request gets a receipt showing what left your device. Stored locally, never uploaded.
      </p>

      <div className="receipts-container">
        <div className="receipts-list">
          {DEMO_RECEIPTS.length === 0 ? (
            <p className="receipts-empty">No receipts yet.</p>
          ) : (
            DEMO_RECEIPTS.map((receipt) => (
              <button
                key={receipt.id}
                className={`receipt-item ${selectedId === receipt.id ? 'active' : ''}`}
                onClick={() => setSelectedId(receipt.id)}
              >
                <div className="receipt-item-time">
                  {receipt.timestamp.toLocaleString()}
                </div>
                <div className="receipt-item-route">
                  {receipt.route === 'CLOUD_SCRUBBED' && '☁ Cloud'}
                  {receipt.route === 'LOCAL_ANSWER' && '🏠 Local'}
                  {receipt.route === 'BLOCK' && '🛑 Blocked'}
                </div>
                <div className="receipt-item-findings">
                  {receipt.findings} findings
                </div>
              </button>
            ))
          )}
        </div>

        <div className="receipts-detail">
          {selectedReceipt ? (
            <ReceiptView receipt={selectedReceipt} />
          ) : (
            <div className="receipts-detail-empty">
              <p>Select a receipt to see what left your device.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
