import { AlertCircle } from 'lucide-react';
import type { Budget, BudgetStatus } from '../../types/finance';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { money } from './budgetUtils';

const statusCopy: Record<BudgetStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  on_track: { label: 'On Track', variant: 'success' },
  near_limit: { label: 'Near Limit', variant: 'warning' },
  over_budget: { label: 'Over Budget', variant: 'danger' },
};

export function BudgetOverviewCard({ budgets, monthlyCap }: { budgets: Budget[]; monthlyCap: number }) {
  const spent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const remaining = monthlyCap - spent;
  const percentage = (spent / monthlyCap) * 100;
  const status: BudgetStatus = percentage >= 100 ? 'over_budget' : percentage >= 80 ? 'near_limit' : 'on_track';
  const copy = statusCopy[status];
  return <Card padding="md" className="h-full flex flex-col justify-between">
    <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-primary">Monthly Budget</p><p className="text-xs text-secondary mt-1">Combined category spending for this month.</p></div><Badge variant={copy.variant}><span aria-hidden="true">{status === 'over_budget' ? '!' : status === 'near_limit' ? '•' : '✓'}</span>{copy.label}</Badge></div>
    <div className="mt-6"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">Spent</p><p className="mt-1 text-2xl sm:text-[28px] font-bold tracking-tight text-primary">{money(spent)}</p></div><div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">Budget cap</p><p className="mt-1 text-sm font-bold text-primary">{money(monthlyCap)}</p></div></div><ProgressBar value={spent} max={monthlyCap} height="lg" color={status === 'over_budget' ? 'dark' : 'orange'} className="mt-4" aria-label={`Monthly budget ${percentage.toFixed(1)} percent used`} /></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="flex items-center gap-1.5 text-secondary"><AlertCircle className="w-3.5 h-3.5 text-accent" aria-hidden="true" />{percentage.toFixed(1)}% used</span><span className={remaining < 0 ? 'font-semibold text-danger' : 'font-semibold text-primary'}>{remaining < 0 ? `${money(Math.abs(remaining))} over` : `${money(remaining)} remaining`}</span></div>
  </Card>;
}
