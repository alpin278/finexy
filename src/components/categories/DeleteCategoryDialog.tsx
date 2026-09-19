import type { FinanceCategory } from '../../types/categories';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function DeleteCategoryDialog({ category, onCancel, onConfirm }: { category?: FinanceCategory | null; onCancel: () => void; onConfirm: () => void }) {
  if (!category) return null;
  return (
    <Modal isOpen onClose={onCancel} title="Archive category?" description="The category will be hidden from active lists without mutating mock Transactions." maxWidth="sm" footer={<><Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button><Button variant="accent" size="sm" onClick={onConfirm} className="bg-danger hover:bg-danger/90">Archive Category</Button></>}>
      <div className="space-y-3"><p className="text-sm text-primary">Are you sure you want to archive <span className="font-semibold">{category.name}</span>?</p>{category.transactionCount > 0 && <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs leading-5 text-primary"><span className="font-semibold">Prototype transactions reference this category.</span> Archiving it will not alter the Transactions mock dataset.</div>}</div>
    </Modal>
  );
}
