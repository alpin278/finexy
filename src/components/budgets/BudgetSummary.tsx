import { Card } from '../ui/Card';
import type { BudgetSummaryData } from '../../lib/budgets';
import { money } from './budgetUtils';
import { ProgressBar } from '../ui/ProgressBar';

function groupedValue(summary: BudgetSummaryData, key: 'limit' | 'spent' | 'remaining') {
  return summary.totalsByCurrency.length
    ? summary.totalsByCurrency.map((total) => money(total[key], total.currency)).join(' · ')
    : '—';
}

export function BudgetSummary({ summary }: { summary: BudgetSummaryData }) {
  const stats = [
    ['Active Budgets', String(summary.activeBudgetCount)],
    ['Budget Limit', groupedValue(summary, 'limit')],
    ['Spent This Period', groupedValue(summary, 'spent')],
    ['Remaining', groupedValue(summary, 'remaining')],
    ['Over Budget', `${summary.overBudgetCategoryCount} ${summary.overBudgetCategoryCount === 1 ? 'Category' : 'Categories'}`],
  ];
  return <section aria-label="Budget summary">
    <Card padding="none" className="sm:hidden p-4">
      <p className="text-sm font-bold text-primary">Budget overview</p>
      {summary.totalsByCurrency.length ? <div className="mt-3 space-y-4">{summary.totalsByCurrency.map((total) => {
        const percentage = total.limit > 0 ? (total.spent / total.limit) * 100 : 0;
        return <div key={total.currency}><p className="text-xs text-secondary">Spent this period</p><p className="mt-1 money-value value-change text-2xl font-bold tracking-tight text-primary">{money(total.spent, total.currency)} <span className="text-sm font-semibold text-secondary">of {money(total.limit, total.currency)}</span></p><ProgressBar value={total.spent} max={total.limit} height="lg" color={percentage >= 100 ? 'dark' : 'orange'} className="mt-3" aria-label={`${total.currency} budget ${percentage.toFixed(1)} percent used`} /><p className={total.remaining < 0 ? 'mt-2 text-xs font-semibold text-danger' : 'mt-2 text-xs font-semibold text-secondary'}>{total.remaining < 0 ? `${money(Math.abs(total.remaining), total.currency)} over budget` : `${money(total.remaining, total.currency)} remaining`}</p></div>;
      })}</div> : <p className="mt-3 text-sm text-secondary">No budgets for this period.</p>}
      <div className="mt-4 grid grid-cols-2 divide-x divide-border border-y border-border py-3 text-sm"><div className="pr-3"><p className="text-xs text-secondary">Active budgets</p><p className="mt-1 font-bold text-primary">{summary.activeBudgetCount}</p></div><div className="pl-3"><p className="text-xs text-secondary">Over budget</p><p className="mt-1 font-bold text-primary">{summary.overBudgetCategoryCount} {summary.overBudgetCategoryCount === 1 ? 'category' : 'categories'}</p></div></div>
    </Card>
    <div className="hidden grid-cols-1 gap-3 sm:grid sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
      {stats.map(([label, value]) => <Card key={label} padding="sm" className="min-w-0"><p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-secondary">{label}</p><p className={label === 'Budget Limit' || label === 'Spent This Period' || label === 'Remaining' ? 'money-value value-change mt-2 truncate text-lg font-bold tracking-tight text-primary sm:text-xl' : 'mt-2 truncate text-lg font-bold tracking-tight text-primary sm:text-xl'}>{value}</p></Card>)}
    </div>
  </section>;
}
