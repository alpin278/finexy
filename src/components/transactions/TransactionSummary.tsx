import { TransactionSummaryCard } from './TransactionSummaryCard';
import { Icon } from '../ui/Icon';
import type { TransactionSummaryData } from '../../lib/transactions';
import type { WalletCurrencyCode } from '../../types/finance';

function formatTotal(amount: number, currency: WalletCurrencyCode) {
  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: currency === 'IDR' ? 0 : 2,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2,
  }).format(amount);
}

export function TransactionSummary({ summary, reportingCurrency }: {
  summary: TransactionSummaryData;
  reportingCurrency: WalletCurrencyCode;
}) {
  return (
    <section aria-label={`Transaction summary in ${reportingCurrency}`} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-primary">Activity summary</h2>
          <p className="mt-0.5 text-xs text-secondary">Cash-flow cards use your {reportingCurrency} reporting currency; transfers count once and stay excluded from totals.</p>
        </div>
        <span className="rounded-full border border-border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary">Reporting currency · {reportingCurrency}</span>
      </div>
      <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TransactionSummaryCard label="Total Transactions" value={<span className="flex items-baseline gap-2"><span>{summary.count}</span><span className="text-xs font-semibold text-secondary">activities</span></span>} detail="Income, expenses, and paired transfers" icon={<Icon name="list-ul" />} iconTone="neutral" />
        <TransactionSummaryCard label="Total Income" value={<span className="money-value value-change">{formatTotal(summary.income[reportingCurrency] ?? 0, reportingCurrency)}</span>} detail="Completed income in reporting currency" icon={<Icon name="arrow-down-left" />} iconTone="success" />
        <TransactionSummaryCard label="Total Expenses" value={<span className="money-value value-change">{formatTotal(summary.expenses[reportingCurrency] ?? 0, reportingCurrency)}</span>} detail="Completed expenses in reporting currency" icon={<Icon name="arrow-up-right" />} iconTone="danger" />
        <TransactionSummaryCard label="Net Cash Flow" value={<span className="money-value value-change">{formatTotal(summary.net[reportingCurrency] ?? 0, reportingCurrency)}</span>} detail="Income minus expenses; transfers excluded" icon={<Icon name="graph-up-arrow" />} iconTone="accent" />
      </div>
    </section>
  );
}

export default TransactionSummary;
