import { TransactionSummaryCard } from './TransactionSummaryCard';
import { Icon } from '../ui/Icon';
import type { TransactionSummaryData } from '../../lib/transactions';
import type { ReactNode } from 'react';

function formatTotals(values: Record<string, number>, sign = ''): ReactNode {
  const entries = Object.entries(values).sort(([left], [right]) => left.localeCompare(right));
  if (!entries.length) return <span className="text-secondary">—</span>;

  return (
    <div className="space-y-1.5">
      {entries.map(([currency, amount]) => (
        <div key={currency} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-2">
          <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-secondary">{currency}</span>
          <span className="whitespace-nowrap text-right text-[clamp(1rem,1.6vw,1.3rem)] [font-variant-numeric:tabular-nums]">
            {sign}{new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
              style: 'currency',
              currency,
              currencyDisplay: 'narrowSymbol',
              minimumFractionDigits: currency === 'IDR' ? 0 : 2,
              maximumFractionDigits: currency === 'IDR' ? 2 : 2,
            }).format(sign ? Math.abs(amount) : amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TransactionSummary({ summary }: { summary: TransactionSummaryData }) {
  return (
    <section aria-label="Transaction summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <TransactionSummaryCard label="Total Transactions" value={String(summary.count)} detail="Active persisted rows" icon={<Icon name="list-ul" />} iconTone="neutral" />
      <TransactionSummaryCard label="Total Income" value={formatTotals(summary.income, '+')} detail="Active non-canceled entries" icon={<Icon name="arrow-down-left" />} iconTone="success" />
      <TransactionSummaryCard label="Total Expenses" value={formatTotals(summary.expenses, '-')} detail="Active non-canceled entries" icon={<Icon name="arrow-up-right" />} iconTone="danger" />
      <TransactionSummaryCard label="Net Cash Flow" value={formatTotals(summary.net)} detail="Currency-specific net totals" icon={<Icon name="graph-up-arrow" />} iconTone="accent" />
    </section>
  );
}

export default TransactionSummary;
