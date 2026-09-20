import { Card } from '../ui/Card';
import type { BudgetSummaryData } from '../../lib/budgets';
import { money } from './budgetUtils';

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
  return <section aria-label="Budget summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5 sm:gap-4">
    {stats.map(([label, value]) => <Card key={label} padding="sm" className="min-w-0"><p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-secondary">{label}</p><p className="mt-2 truncate text-lg font-bold tracking-tight text-primary sm:text-xl">{value}</p></Card>)}
  </section>;
}
