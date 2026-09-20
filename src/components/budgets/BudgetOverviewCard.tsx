import { AlertCircle } from 'lucide-react';
import type { Budget, BudgetStatus } from '../../types/finance';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { groupBudgetTotals, money } from './budgetUtils';

const statusCopy: Record<BudgetStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  on_track: { label: 'On Track', variant: 'success' },
  near_limit: { label: 'Near Limit', variant: 'warning' },
  over_budget: { label: 'Over Budget', variant: 'danger' },
};

export function BudgetOverviewCard({ budgets, periodLabel }: { budgets: Budget[]; periodLabel: string }) {
  const totals = groupBudgetTotals(budgets);
  const status: BudgetStatus = budgets.some((budget) => budget.status === 'over_budget') ? 'over_budget' : budgets.some((budget) => budget.status === 'near_limit') ? 'near_limit' : 'on_track';
  const copy = statusCopy[status];
  return <Card padding="md" className="flex h-full flex-col justify-between"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-primary">Budget overview</p><p className="mt-1 text-xs text-secondary">Persisted limits and ledger spend for {periodLabel}.</p></div><Badge variant={copy.variant}><span aria-hidden="true">{status === 'over_budget' ? '!' : status === 'near_limit' ? '•' : '✓'}</span>{copy.label}</Badge></div>{totals.length ? <div className="mt-6 space-y-5">{totals.map((total) => { const percentage = total.limit > 0 ? (total.spent / total.limit) * 100 : 0; return <div key={total.currency}><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">{total.currency} spent</p><p className="mt-1 text-2xl font-bold tracking-tight text-primary">{money(total.spent, total.currency)}</p></div><div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">{total.currency} limit</p><p className="mt-1 text-sm font-bold text-primary">{money(total.limit, total.currency)}</p></div></div><ProgressBar value={total.spent} max={total.limit} height="lg" color={percentage >= 100 ? 'dark' : 'orange'} className="mt-4" aria-label={`${total.currency} budget ${percentage.toFixed(1)} percent used`} /><div className="mt-2 flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-1.5 text-secondary"><AlertCircle className="h-3.5 w-3.5 text-accent" aria-hidden="true" />{percentage.toFixed(1)}% used</span><span className={total.remaining < 0 ? 'font-semibold text-danger' : 'font-semibold text-primary'}>{total.remaining < 0 ? `${money(Math.abs(total.remaining), total.currency)} over` : `${money(total.remaining, total.currency)} remaining`}</span></div></div>; })}</div> : <div className="mt-6 rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center text-xs text-secondary">No budgets for this period.</div>}</Card>;
}
