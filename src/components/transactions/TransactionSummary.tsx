import { ArrowDownLeft, ArrowUpRight, List, TrendingUp } from 'lucide-react';
import { TransactionSummaryCard } from './TransactionSummaryCard';

export function TransactionSummary() {
  return (
    <section aria-label="Transaction summary" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <TransactionSummaryCard
        label="Total Transactions"
        value="1,248"
        detail="All tracked activity • Lifetime"
        icon={<List className="w-4 h-4" />}
        iconTone="neutral"
      />
      <TransactionSummaryCard
        label="Total Income"
        value="+$42,850.00"
        trend="+12%"
        detail="vs. last month"
        trendTone="positive"
        icon={<ArrowDownLeft className="w-4 h-4" />}
        iconTone="success"
      />
      <TransactionSummaryCard
        label="Total Expenses"
        value="-$14,320.00"
        trend="-4.1%"
        detail="within budget cap"
        trendTone="negative"
        icon={<ArrowUpRight className="w-4 h-4" />}
        iconTone="danger"
      />
      <TransactionSummaryCard
        label="Net Cash Flow"
        value="+$28,530.00"
        trend="Healthy Surplus"
        detail="66.5% savings rate"
        trendTone="positive"
        icon={<TrendingUp className="w-4 h-4" />}
        iconTone="accent"
      />
    </section>
  );
}

export default TransactionSummary;
