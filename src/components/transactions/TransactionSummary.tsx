import { TransactionSummaryCard } from './TransactionSummaryCard';
import { Icon } from '../ui/Icon';
import type { TransactionSummaryData } from '../../lib/transactions';
import type { ReactNode } from 'react';
import { Select } from '../ui/Select';
import type { CurrencyCode } from '../../types/finance';

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

type SummaryCurrency = 'all' | CurrencyCode;

function selectedTotals(values: Record<string, number>, currency: SummaryCurrency) {
  if (currency === 'all') return values;
  return currency in values ? { [currency]: values[currency] } : {};
}

export function TransactionSummary({ summary, currency, currencies, onCurrencyChange }: {
  summary: TransactionSummaryData;
  currency: SummaryCurrency;
  currencies: CurrencyCode[];
  onCurrencyChange: (currency: SummaryCurrency) => void;
}) {
  return (
    <section aria-label="Transaction summary" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-primary">Activity summary</h2>
          <p className="mt-0.5 text-xs text-secondary">Transfers count once; financial totals exclude transfers.</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-secondary">
          <span>Summary currency</span>
          <Select
            aria-label="Summary currency"
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value as SummaryCurrency)}
            className="w-[164px]"
            options={[{ value: 'all', label: 'All currencies' }, ...currencies.map((code) => ({ value: code, label: code }))]}
          />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TransactionSummaryCard label="Total Transactions" value={<span className="flex items-baseline gap-2"><span>{summary.count}</span><span className="text-xs font-semibold text-secondary">activities</span></span>} detail="Income, expenses, and paired transfers" icon={<Icon name="list-ul" />} iconTone="neutral" />
        <TransactionSummaryCard label="Total Income" value={formatTotals(selectedTotals(summary.income, currency), '+')} detail="Active non-canceled income" icon={<Icon name="arrow-down-left" />} iconTone="success" />
        <TransactionSummaryCard label="Total Expenses" value={formatTotals(selectedTotals(summary.expenses, currency), '-')} detail="Active non-canceled expenses" icon={<Icon name="arrow-up-right" />} iconTone="danger" />
        <TransactionSummaryCard label="Net Cash Flow" value={formatTotals(selectedTotals(summary.net, currency))} detail="Currency-specific net totals" icon={<Icon name="graph-up-arrow" />} iconTone="accent" />
      </div>
    </section>
  );
}

export default TransactionSummary;
