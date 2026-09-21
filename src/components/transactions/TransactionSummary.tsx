import { TransactionSummaryCard } from './TransactionSummaryCard';
import { Icon } from '../ui/Icon';
import type { TransactionSummaryData } from '../../lib/transactions';
import type { ReactNode } from 'react';

function formatTotals(values: Record<string, number>, sign = ''): ReactNode {
  const entries = Object.entries(values);
  if (!entries.length) return <span className="text-secondary">—</span>;

  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
      {entries.map(([currency, amount]) => (
        <span key={currency} className="inline-flex min-w-0 max-w-full items-baseline gap-1.5">
          <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-secondary">{currency}</span>
          <span className="break-words">
            {sign}{new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
              style: 'currency',
              currency,
              currencyDisplay: 'narrowSymbol',
              minimumFractionDigits: 2,
            }).format(sign ? Math.abs(amount) : amount)}
          </span>
        </span>
      ))}
    </div>
  );
}

export function TransactionSummary({ summary }: { summary: TransactionSummaryData }) {
  return (
    <section aria-label="Transaction summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <TransactionSummaryCard label="Total Transactions" value={String(summary.count)} detail="Active persisted rows" icon={<Icon name="list-ul" />} iconTone="neutral" />
      <TransactionSummaryCard label="Total Income" value={formatTotals(summary.income, '+')} detail="Completed and pending entries" icon={<Icon name="arrow-down-left" />} iconTone="success" />
      <TransactionSummaryCard label="Total Expenses" value={formatTotals(summary.expenses, '-')} detail="Completed and pending entries" icon={<Icon name="arrow-up-right" />} iconTone="danger" />
      <TransactionSummaryCard label="Net Cash Flow" value={formatTotals(summary.net)} detail="Completed and pending totals" icon={<Icon name="graph-up-arrow" />} iconTone="accent" />
    </section>
  );
}

export default TransactionSummary;
