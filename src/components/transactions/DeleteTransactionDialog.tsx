import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { Transaction } from '../../types/finance';

export interface DeleteTransactionDialogProps {
  transaction?: Transaction | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteTransactionDialog({ transaction, onCancel, onConfirm }: DeleteTransactionDialogProps) {
  return (
    <Modal
      isOpen={Boolean(transaction)}
      onClose={onCancel}
      title="Archive transaction?"
      description="Archived transactions leave the active ledger and no longer affect wallet balances."
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            type="button"
            className="bg-danger hover:bg-danger/90"
          >
            Archive
          </Button>
        </>
      }
    >
      <p className="text-sm text-secondary leading-relaxed">
        Are you sure you want to archive <span className="font-semibold text-primary">{transaction?.description}</span>?
      </p>
    </Modal>
  );
}

export default DeleteTransactionDialog;
