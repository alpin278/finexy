import type { Budget } from '../../types/finance';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { money, periodLabel } from './budgetUtils';

const statusCopy = { on_track: ['On Track', 'success'], near_limit: ['Near Limit', 'warning'], over_budget: ['Over Budget', 'danger'] } as const;

export function BudgetDetailModal({ budget, onClose }: { budget?: Budget | null; onClose: () => void }) {
  if (!budget) return null;
  const percentage = (budget.spent / budget.monthlyLimit) * 100;
  const remaining = budget.monthlyLimit - budget.spent;
  const [label, variant] = statusCopy[budget.status];
  return <Modal isOpen onClose={onClose} title={budget.categoryName} description="A read-only view of this persisted category budget." maxWidth="md" footer={<Button variant="outline" size="sm" onClick={onClose}>Close</Button>}>
    <div className="space-y-5"><div className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">{budget.currency}</span><Badge variant={variant}>{label}</Badge></div><p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">Monthly budget</p><p className="mt-1 text-3xl font-bold tracking-tight text-primary">{money(budget.monthlyLimit, budget.currency)}</p></div><dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3"><div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Spent</dt><dd className="mt-1 text-xs font-medium text-primary">{money(budget.spent, budget.currency)}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">{remaining < 0 ? 'Exceeded' : 'Remaining'}</dt><dd className={remaining < 0 ? 'mt-1 text-xs font-semibold text-danger' : 'mt-1 text-xs font-medium text-primary'}>{money(Math.abs(remaining), budget.currency)}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Usage</dt><dd className="mt-1 text-xs font-medium text-primary">{percentage.toFixed(1)}%</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Transactions</dt><dd className="mt-1 text-xs font-medium text-primary">{budget.transactionCount}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Period</dt><dd className="mt-1 text-xs font-medium text-primary">{periodLabel(budget.period)}</dd></div></dl>{budget.notes && <div className="border-t border-border pt-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Notes</p><p className="mt-1 text-xs text-primary">{budget.notes}</p></div>}</div>
  </Modal>;
}
