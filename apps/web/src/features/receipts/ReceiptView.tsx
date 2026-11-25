import { Receipt } from '../../lib/receipts';

interface ReceiptViewProps {
  receipt: Receipt;
}

/**
 * Shows a single receipt: "What left your device" diff.
 * Originals on left, sent text on right. BRIEF §P0-7.
 */
export default function ReceiptView(_props: ReceiptViewProps): React.JSX.Element {
  throw new Error('not implemented: architecture-skeleton');
}
