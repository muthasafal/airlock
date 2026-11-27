import React, { useState } from 'react';
import ReceiptView from './ReceiptView';
import GhostTip from '../../ui/Ghost/Ghost';
import { useReceipts } from './useReceipts';
import './ReceiptsPage.css';

const ROUTE_LABEL = { CLOUD_SCRUBBED: 'Cloud (cleaned)', LOCAL_ANSWER: 'Stayed on device', BLOCK: 'Held back' } as const;

/**
 * Receipts page showing all requests and their what-left-your-device details.
 * Stored locally, never uploaded. BRIEF §P0-7.
 */
export default function ReceiptsPage(): React.JSX.Element {
  const { receipts, clear, remove, exportJson, originalFor } = useReceipts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedReceipt = selectedId ? receipts.find((r) => r.id === selectedId) : receipts[0];

  return (
    <div className="receipts-page">
      <h1 className="receipts-title">Receipts</h1>
      <p className="receipts-description">
        Every request gets a receipt showing what left your device. Stored locally, never uploaded.
      </p>
      {receipts.length > 0 && (
        <div className="receipt-view-actions">
          <button className="receipt-view-action-button" onClick={exportJson}>
            Export all as JSON
          </button>
          <button className="receipt-view-action-button" onClick={() => void clear()}>
            Clear all
          </button>
        </div>
      )}

      <div className="receipts-container">
        <div className="receipts-list">
          {receipts.length === 0 ? (
            <div className="receipts-empty">
              <GhostTip mood="calm" compact>
                Nothing has left your device yet, so there is nothing to show. Send a message in Airlock Chat and its receipt lands here.
              </GhostTip>
            </div>
          ) : (
            receipts.map((receipt) => {
              const findings = Object.values(receipt.categoryCounts).reduce((a, b) => a + (b ?? 0), 0);
              return (
                <button
                  key={receipt.id}
                  className={`receipt-item ${selectedReceipt?.id === receipt.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(receipt.id)}
                >
                  <div className="receipt-item-time">{new Date(receipt.timestamp).toLocaleString()}</div>
                  <div className="receipt-item-route">{ROUTE_LABEL[receipt.routeDecision]}</div>
                  <div className="receipt-item-findings">
                    {findings} finding{findings === 1 ? '' : 's'}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="receipts-detail">
          {selectedReceipt ? (
            <ReceiptView
              receipt={selectedReceipt}
              original={originalFor(selectedReceipt)}
              onDelete={() => {
                void remove(selectedReceipt.id);
                setSelectedId(null);
              }}
            />
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
