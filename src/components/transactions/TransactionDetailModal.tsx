import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import type { Transaction } from '../../types/finance';
import { formatTransactionAmount, formatTransactionDate, getStatusLabel } from './transactionUtils';

export interface TransactionDetailModalProps {
  transaction?: Transaction | null;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  return (
    <Modal
      isOpen={Boolean(transaction)}
      onClose={onClose}
      title="Transaction Details"
      description="A read-only view of this persisted ledger transaction."
      maxWidth="md"
    >
      {transaction && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-surface border border-border p-4">
            <p className="text-sm font-semibold text-primary">{transaction.description}</p>
            <p className="text-xs text-secondary mt-1">{transaction.payee}</p>
            <p className={transaction.type === 'income' ? 'text-xl font-bold text-success mt-4' : 'text-xl font-bold text-primary mt-4'}>
              {formatTransactionAmount(transaction)}
            </p>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Reference ID</dt>
              <dd className="text-xs font-mono text-primary mt-1">{transaction.reference}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Type</dt>
              <dd className="text-xs text-primary mt-1 capitalize">{transaction.type}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Category</dt>
              <dd className="text-xs text-primary mt-1">{transaction.category}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Wallet</dt>
              <dd className="text-xs text-primary mt-1">{transaction.wallet}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Date &amp; Time</dt>
              <dd className="text-xs text-primary mt-1">{formatTransactionDate(transaction.date)} · {transaction.time}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Status</dt>
              <dd className="mt-1">
                <StatusBadge status={transaction.status} label={getStatusLabel(transaction.status)} />
              </dd>
            </div>
          </dl>

          <div className="border-t border-border pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Notes / Secondary reference</p>
            <p className="text-xs text-primary mt-1">{transaction.secondaryReference || 'No note added.'}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default TransactionDetailModal;
