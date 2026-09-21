import { useState, type KeyboardEvent } from 'react';
import { Card } from '../ui/Card';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '../ui/Table';
import type { Transaction } from '../../types/finance';
import { TransactionRow } from './TransactionRow';

export interface TransactionTableProps { transactions: Transaction[]; onView: (transaction: Transaction) => void; onEdit: (transaction: Transaction) => void; onDelete: (transaction: Transaction) => void; onCreate?: () => void; }

export function TransactionTable({ transactions, onView, onEdit, onDelete, onCreate }: TransactionTableProps) {
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const next = selectedIndex < 0 ? (direction > 0 ? 0 : transactions.length - 1) : Math.max(0, Math.min(transactions.length - 1, selectedIndex + direction));
      setSelectedIndex(next);
      window.requestAnimationFrame(() => document.querySelector(`[data-transaction-row="${next}"]`)?.scrollIntoView({ block: 'nearest' }));
    } else if (event.key === 'Enter' && selectedIndex >= 0 && selectedIndex < transactions.length) { event.preventDefault(); onView(transactions[selectedIndex]); }
    else if (event.key === 'Escape') { setSelectedIndex(-1); setOpenActionId(null); }
  };
  return <Card padding="none" tabIndex={0} onKeyDown={handleKeyDown} aria-label="Transaction activity. Use up and down arrows to select a row and Enter to open details." className="min-w-0 overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25">
    <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5"><div><h2 className="text-sm font-bold text-primary sm:text-base">Transaction Activity</h2><p className="mt-0.5 text-xs text-secondary">Income, expenses, and wallet transfers shown as logical activities.</p></div><span className="hidden items-center rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-success sm:inline-flex">Persisted data</span></div>
    <div className="mt-4 border-t border-border/60"><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Activity</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="hidden sm:table-cell">Status</TableHead><TableHead className="pr-5 text-right">Action</TableHead></TableRow></TableHeader><TableBody>{transactions.length === 0 ? <TableRow><TableCell colSpan={4} className="py-12 text-center"><span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-surface text-secondary"><i className="bi bi-receipt" aria-hidden="true" /></span><p className="mt-3 text-sm font-semibold text-primary">No transactions for this period.</p><p className="mt-1 text-xs text-secondary">Record a transaction or adjust the active filters.</p>{onCreate && <button type="button" onClick={onCreate} className="mt-3 rounded-full bg-dark px-3.5 py-2 text-xs font-semibold text-white transition-transform active:scale-[0.98]">Record Transaction</button>}</TableCell></TableRow> : transactions.map((transaction, index) => <TransactionRow key={transaction.id} transaction={transaction} selected={selectedIndex === index} rowIndex={index} onSelect={() => setSelectedIndex(index)} isActionMenuOpen={openActionId === transaction.id} onToggleActionMenu={() => setOpenActionId((current) => current === transaction.id ? null : transaction.id)} onView={() => { setOpenActionId(null); onView(transaction); }} onEdit={() => { setOpenActionId(null); onEdit(transaction); }} onDelete={() => { setOpenActionId(null); onDelete(transaction); }} />)}</TableBody></Table></div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-3.5 text-xs text-secondary sm:px-5"><span>Showing {transactions.length} logical activit{transactions.length === 1 ? 'y' : 'ies'}</span><span className="hidden sm:inline">↑ ↓ select · Enter details · Esc clear</span></div>
  </Card>;
}

export default TransactionTable;
