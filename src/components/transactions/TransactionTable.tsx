import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '../ui/Table';
import type { Transaction } from '../../types/finance';
import { TransactionRow } from './TransactionRow';

export interface TransactionTableProps {
  transactions: Transaction[];
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionTable({ transactions, onView, onEdit, onDelete }: TransactionTableProps) {
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pageNumbers = [1, 2, 3, 178];

  return (
    <Card padding="none" className="min-w-0 overflow-visible">
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-primary">Transaction Activity</h2>
          <p className="text-xs text-secondary mt-0.5">Your latest income and expenses across all wallets.</p>
        </div>
        <span className="hidden sm:inline-flex items-center rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">
          Preview data
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <Table className="min-w-[1080px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Transaction / Payee</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Wallet / Method</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center text-secondary">
                  No transactions match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  isActionMenuOpen={openActionId === transaction.id}
                  onToggleActionMenu={() =>
                    setOpenActionId((current) => (current === transaction.id ? null : transaction.id))
                  }
                  onView={() => {
                    setOpenActionId(null);
                    onView(transaction);
                  }}
                  onEdit={() => {
                    setOpenActionId(null);
                    onEdit(transaction);
                  }}
                  onDelete={() => {
                    setOpenActionId(null);
                    onDelete(transaction);
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60 px-4 sm:px-5 py-4 text-xs text-secondary">
        <span>
          {transactions.length > 0
            ? `Showing 1 to ${transactions.length} of 1,248 transactions`
            : 'Showing 0 of 1,248 transactions'}
        </span>
        <nav aria-label="Transaction pagination" className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            aria-label="Previous page"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="w-7 h-7 rounded-full flex items-center justify-center border border-border text-secondary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {pageNumbers.map((page, index) => (
            <span key={page} className="inline-flex items-center">
              {index === 3 && <span className="w-6 text-center text-secondary">…</span>}
              <button
                type="button"
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
                onClick={() => setCurrentPage(page)}
                className={
                  currentPage === page
                    ? 'w-7 h-7 rounded-full bg-dark text-white text-xs font-semibold cursor-pointer'
                    : 'w-7 h-7 rounded-full text-xs font-medium text-secondary hover:bg-surface hover:text-primary cursor-pointer'
                }
              >
                {page}
              </button>
            </span>
          ))}
          <button
            type="button"
            aria-label="Next page"
            onClick={() => setCurrentPage((page) => Math.min(178, page + 1))}
            className="w-7 h-7 rounded-full flex items-center justify-center border border-border text-secondary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      </div>
    </Card>
  );
}

export default TransactionTable;
