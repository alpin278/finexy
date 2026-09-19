import { ArrowDownLeft, ArrowUpRight, List, TrendingUp } from 'lucide-react';
import { TransactionSummaryCard } from './TransactionSummaryCard';
import type { TransactionSummaryData } from '../../lib/transactions';

function formatTotals(values: Record<string, number>) {
  const entries = Object.entries(values);
  if (!entries.length) return '—';
  return entries.map(([currency, amount]) => new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2 }).format(amount)).join(' · ');
}

export function TransactionSummary({ summary }: { summary: TransactionSummaryData }) {
  return <section aria-label="Transaction summary" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    <TransactionSummaryCard label="Total Transactions" value={String(summary.count)} detail="Active persisted rows" icon={<List className="w-4 h-4" />} iconTone="neutral" />
    <TransactionSummaryCard label="Total Income" value={`+${formatTotals(summary.income)}`} detail="Completed and pending entries" icon={<ArrowDownLeft className="w-4 h-4" />} iconTone="success" />
    <TransactionSummaryCard label="Total Expenses" value={`-${formatTotals(summary.expenses)}`} detail="Completed and pending entries" icon={<ArrowUpRight className="w-4 h-4" />} iconTone="danger" />
    <TransactionSummaryCard label="Net Cash Flow" value={formatTotals(summary.net)} detail="Completed and pending totals" icon={<TrendingUp className="w-4 h-4" />} iconTone="accent" />
  </section>;
}

export default TransactionSummary;
