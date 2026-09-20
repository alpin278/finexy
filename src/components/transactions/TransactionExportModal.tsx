import { useState } from 'react';
import { transactionStatuses } from '../../data/transactions';
import type { TransactionStatus, TransactionType } from '../../types/finance';
import type { TransactionExportFilters } from '../../lib/transaction-export';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';

export interface TransactionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: TransactionExportFilters) => void;
  categories: readonly string[];
  wallets: readonly string[];
  initialFilters: TransactionExportFilters;
}

const typeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

export function TransactionExportModal({ isOpen, onClose, onExport, categories, wallets, initialFilters }: TransactionExportModalProps) {
  const [filters, setFilters] = useState(initialFilters);

  const update = <K extends keyof TransactionExportFilters>(key: K, value: TransactionExportFilters[K]) => setFilters((current) => ({ ...current, [key]: value }));
  const categoryOptions = [{ value: 'all', label: 'All categories' }, ...categories.map((category) => ({ value: category, label: category }))];
  const walletOptions = [{ value: 'all', label: 'All wallets' }, ...wallets.map((wallet) => ({ value: wallet, label: wallet }))];
  const statusOptions = [{ value: 'all', label: 'All statuses' }, ...transactionStatuses];

  return <Modal isOpen={isOpen} onClose={onClose} title="Export transactions" description="Choose exactly what to include in your UTF-8 CSV file." maxWidth="md" footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button variant="accent" size="sm" onClick={() => { onExport(filters); onClose(); }}>Download CSV</Button></>}>
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="export-date-from" className="mb-1.5 block text-xs font-semibold text-primary">From date</label><Input id="export-date-from" type="date" value={filters.dateFrom} onChange={(event) => update('dateFrom', event.target.value)} /></div>
        <div><label htmlFor="export-date-to" className="mb-1.5 block text-xs font-semibold text-primary">To date</label><Input id="export-date-to" type="date" value={filters.dateTo} onChange={(event) => update('dateTo', event.target.value)} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="export-type" className="mb-1.5 block text-xs font-semibold text-primary">Transaction type</label><Select id="export-type" value={filters.type} onChange={(event) => update('type', event.target.value as 'all' | TransactionType)} options={typeOptions} className="w-full" /></div>
        <div><label htmlFor="export-status" className="mb-1.5 block text-xs font-semibold text-primary">Status</label><Select id="export-status" value={filters.status} onChange={(event) => update('status', event.target.value as 'all' | TransactionStatus)} options={statusOptions} className="w-full" /></div>
        <div><label htmlFor="export-wallet" className="mb-1.5 block text-xs font-semibold text-primary">Wallet</label><Select id="export-wallet" value={filters.wallet} onChange={(event) => update('wallet', event.target.value)} options={walletOptions} className="w-full" /></div>
        <div><label htmlFor="export-category" className="mb-1.5 block text-xs font-semibold text-primary">Category</label><Select id="export-category" value={filters.category} onChange={(event) => update('category', event.target.value)} options={categoryOptions} className="w-full" /></div>
      </div>
      <p className="rounded-xl border border-border bg-surface px-3.5 py-3 text-xs leading-relaxed text-secondary">Amounts stay numeric and each row includes its currency, so USD, EUR, GBP, and IDR remain explicit in spreadsheets.</p>
    </div>
  </Modal>;
}
