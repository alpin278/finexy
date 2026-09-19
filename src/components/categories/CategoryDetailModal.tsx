import type { FinanceCategory } from '../../types/categories';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusBadge } from '../ui/StatusBadge';
import { budgetStatusCopy, getCategoryBudgetStatus, money, operatorLabels } from './categoryUtils';
import { CategoryIcon } from './CategoryIcon';
import type { CategoryRule } from '../../types/categories';

export function CategoryDetailModal({ category, rules, onClose }: { category?: FinanceCategory | null; rules: CategoryRule[]; onClose: () => void }) {
  if (!category) return null;
  const hasBudget = category.type === 'expense' && category.budgetLimit !== undefined;
  const spent = category.spent ?? category.monthlyAverage;
  const percentage = hasBudget ? (spent / category.budgetLimit!) * 100 : 0;
  const budgetStatus = hasBudget ? getCategoryBudgetStatus(spent, category.budgetLimit!) : null;
  const categoryRules = rules.filter((rule) => rule.categoryId === category.id);

  return (
    <Modal isOpen onClose={onClose} title={category.name} description="A read-only view of this persisted category." maxWidth="md" footer={<Button variant="outline" size="sm" onClick={onClose}>Close</Button>}>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white"><CategoryIcon name={category.icon} className="h-5 w-5" /></div><div><p className="text-sm font-bold text-primary">{category.name}</p><p className="mt-0.5 text-xs text-secondary">{category.type === 'expense' ? 'Expense category' : 'Income category'}</p></div></div>
          <StatusBadge status={category.status} />
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
          <div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Prototype transactions</dt><dd className="mt-1 text-xs font-medium text-primary">{category.transactionCount}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Monthly average</dt><dd className="mt-1 text-xs font-medium text-primary">{money(category.monthlyAverage)}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Matching rules</dt><dd className="mt-1 text-xs font-medium text-primary">{categoryRules.length}</dd></div>
        </dl>
        {hasBudget && budgetStatus ? <div className="border-t border-border pt-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Budget</p><p className="mt-1 text-lg font-bold text-primary">{money(category.budgetLimit!)}</p></div><Badge variant={budgetStatusCopy[budgetStatus].variant}>{budgetStatusCopy[budgetStatus].label}</Badge></div><ProgressBar value={spent} max={category.budgetLimit} className="mt-3" aria-label={`${category.name}: ${percentage.toFixed(1)} percent used`} /><div className="mt-2 flex justify-between text-xs text-secondary"><span>Budget usage</span><span className="font-semibold text-primary">{percentage.toFixed(1)}%</span></div></div> : category.type === 'expense' ? <div className="border-t border-border pt-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Budget</p><p className="mt-1 text-sm font-semibold text-secondary">No budget</p><p className="mt-1 text-xs text-secondary">Budget data will be connected when Budgets migrates.</p></div> : null}
        <div className="border-t border-border pt-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Keywords</p><div className="mt-2 flex flex-wrap gap-1.5">{category.keywords.length ? category.keywords.map((keyword) => <span key={keyword} className="rounded-full border border-border bg-surface px-2 py-1 text-[11px] text-primary">{keyword}</span>) : <span className="text-xs text-secondary">No keywords configured.</span>}</div></div>
        <div className="border-t border-border pt-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Matching rules</p><div className="mt-2 space-y-2">{categoryRules.length ? categoryRules.map((rule) => <div key={rule.id} className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-primary">{rule.field} {operatorLabels[rule.operator]} <span className="font-semibold">“{rule.value}”</span></div>) : <span className="text-xs text-secondary">No local rules configured.</span>}</div></div>
      </div>
    </Modal>
  );
}
