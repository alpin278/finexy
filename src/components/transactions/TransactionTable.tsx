import { useState } from 'react';
import { Card } from '../ui/Card';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '../ui/Table';
import type { Transaction } from '../../types/finance';
import { TransactionRow } from './TransactionRow';

export interface TransactionTableProps { transactions: Transaction[]; onView: (transaction: Transaction) => void; onEdit: (transaction: Transaction) => void; onDelete: (transaction: Transaction) => void; }

export function TransactionTable({ transactions, onView, onEdit, onDelete }: TransactionTableProps) {
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  return <Card padding="none" className="min-w-0 overflow-visible">
    <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5"><div><h2 className="text-sm font-bold text-primary sm:text-base">Transaction Activity</h2><p className="mt-0.5 text-xs text-secondary">Income, expenses, and wallet transfers shown as logical activities.</p></div><span className="hidden items-center rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-success sm:inline-flex">Persisted data</span></div>
    <div className="mt-4 border-t border-border/60"><Table className="min-w-[1010px]"><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Activity</TableHead><TableHead>Category / Type</TableHead><TableHead>Wallet / Method</TableHead><TableHead>Date &amp; Time</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="pr-5 text-right">Action</TableHead></TableRow></TableHeader><TableBody>{transactions.length === 0 ? <TableRow><TableCell colSpan={7} className="py-14 text-center text-secondary">No activities match the selected filters.</TableCell></TableRow> : transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} isActionMenuOpen={openActionId === transaction.id} onToggleActionMenu={() => setOpenActionId((current) => current === transaction.id ? null : transaction.id)} onView={() => { setOpenActionId(null); onView(transaction); }} onEdit={() => { setOpenActionId(null); onEdit(transaction); }} onDelete={() => { setOpenActionId(null); onDelete(transaction); }} />)}</TableBody></Table></div>
    <div className="border-t border-border/60 px-4 py-3.5 text-xs text-secondary sm:px-5">Showing {transactions.length} logical activit{transactions.length === 1 ? 'y' : 'ies'}</div>
  </Card>;
}

export default TransactionTable;
