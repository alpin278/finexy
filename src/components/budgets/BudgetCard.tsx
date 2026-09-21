import type { Budget, BudgetStatus } from '../../types/finance';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { money } from './budgetUtils';
import { Icon } from '../ui/Icon';
import { CategoryIcon } from '../categories/CategoryIcon';

const statusCopy: Record<BudgetStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = { on_track: { label: 'On Track', variant: 'success' }, near_limit: { label: 'Near Limit', variant: 'warning' }, over_budget: { label: 'Over Budget', variant: 'danger' } };

export interface BudgetCardProps { budget: Budget; menuOpen: boolean; onToggleMenu: () => void; onView: () => void; onEdit: () => void; onDelete: () => void; }
export function BudgetCard({ budget, menuOpen, onToggleMenu, onView, onEdit, onDelete }: BudgetCardProps) {
  const percentage = (budget.spent / budget.monthlyLimit) * 100;
  const remaining = budget.monthlyLimit - budget.spent;
  const copy = statusCopy[budget.status];
  return <Card padding="md" hoverable className="relative min-w-0 flex flex-col gap-5">
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-accent" aria-hidden="true"><CategoryIcon name={budget.icon} /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-primary">{budget.categoryName}</p><p className="mt-0.5 text-xs text-secondary">{budget.transactionCount} recorded transactions</p></div></div><div className="relative shrink-0"><IconButton type="button" size="sm" variant="ghost" aria-label={`Actions for ${budget.categoryName} budget`} aria-expanded={menuOpen} onClick={onToggleMenu}><Icon name="three-dots" /></IconButton>{menuOpen && <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-border bg-white py-1 shadow-lg menu-enter"><button type="button" onClick={onView} className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">View Details</button><button type="button" onClick={onEdit} className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">Edit Budget</button><button type="button" onClick={onDelete} className="w-full px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger/10">Delete Budget</button></div>}</div></div>
    <div className="grid grid-cols-2 gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">Spent this period</p><p className="mt-1 text-sm font-bold text-primary">{money(budget.spent, budget.currency)}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">Budget limit</p><p className="mt-1 text-sm font-bold text-primary">{money(budget.monthlyLimit, budget.currency)}</p></div></div>
    <div><div className="flex items-center justify-between gap-3 text-xs"><span className="text-secondary">{budget.status === 'over_budget' ? 'Exceeded by' : 'Remaining'}</span><span className={budget.status === 'over_budget' ? 'whitespace-nowrap font-semibold text-danger' : 'whitespace-nowrap font-semibold text-primary'}>{budget.status === 'over_budget' ? money(Math.abs(remaining), budget.currency) : money(remaining, budget.currency)}</span></div><ProgressBar value={budget.spent} max={budget.monthlyLimit} height="sm" color={budget.status === 'over_budget' ? 'dark' : 'orange'} className="mt-2" aria-label={`${budget.categoryName}: ${percentage.toFixed(1)} percent used`} /></div>
    <div className="flex items-center justify-between gap-3 border-t border-border pt-4"><span className={budget.status === 'over_budget' ? 'text-xs font-bold text-danger' : 'text-xs font-bold text-primary'}>{percentage.toFixed(1)}% {budget.status === 'over_budget' ? 'Over' : 'used'}</span><Badge variant={copy.variant}>{copy.label}</Badge></div>
  </Card>;
}
