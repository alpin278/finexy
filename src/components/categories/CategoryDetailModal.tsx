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
  const hasBudget = category.type === 'expense' && category.budgetLimit !== undefined && category.budgetCurrency !== undefined;
  const spent = category.budgetSpent ?? 0;
  const percentage = hasBudget ? (spent / category.budgetLimit!) * 100 : 0;
  const budgetStatus = hasBudget ? category.budgetStatus ?? getCategoryBudgetStatus(spent, category.budgetLimit!) : null;
  const categoryRules = rules.filter((rule) => rule.categoryId === category.id);

  return (
    <Modal isOpen onClose={onClose} title={category.name} description="A read-only view of this persisted category." maxWidth="md" footer={<Button variant="outline" size="sm" onClick={onClose}>Close</Button>}>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border dark:border-[#2E2E28] bg-surface dark:bg-[#1A1A17] p-4">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border dark:border-[#32322A] bg-card dark:bg-[#22221E]"><CategoryIcon name={category.icon} className="h-5 w-5 text-primary dark:text-[#F2F2EE]" /></div><div><p className="text-sm font-bold text-primary dark:text-[#F2F2EE]">{category.name}</p><p className="mt-0.5 text-xs text-secondary dark:text-[#8E8E86]">{category.type === 'expense' ? 'Expense category' : 'Income category'}</p></div></div>
          <StatusBadge status={category.status} />
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
          <div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary dark:text-[#8E8E86]">{hasBudget ? 'Qualifying transactions' : 'Prototype transactions'}</dt><dd className="mt-1 text-xs font-medium text-primary dark:text-[#F2F2EE]">{hasBudget ? category.budgetTransactionCount : category.transactionCount}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary dark:text-[#8E8E86]">Monthly average</dt><dd className="mt-1 text-xs font-medium text-primary dark:text-[#F2F2EE]">{money(category.monthlyAverage)}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-wider text-secondary dark:text-[#8E8E86]">Matching rules</dt><dd className="mt-1 text-xs font-medium text-primary dark:text-[#F2F2EE]">{categoryRules.length}</dd></div>
        </dl>
        {hasBudget && budgetStatus ? <div className="border-t border-border dark:border-[#2E2E28] pt-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-secondary dark:text-[#8E8E86]">Budget</p><p className="mt-1 text-lg font-bold text-primary dark:text-[#F2F2EE]">{money(category.budgetLimit!, category.budgetCurrency)}</p></div><Badge variant={budgetStatusCopy[budgetStatus].variant}>{budgetStatusCopy[budgetStatus].label}</Badge></div><div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="text-secondary dark:text-[#8E8E86]">Spent this period</span><span className="font-semibold text-primary dark:text-[#F2F2EE]">{money(spent, category.budgetCurrency)}</span></div><ProgressBar value={spent} max={category.budgetLimit} className="mt-2" aria-label={`${category.name}: ${percentage.toFixed(1)} percent used`} /><div className="mt-2 flex justify-between text-xs text-secondary dark:text-[#8E8E86]"><span>{percentage >= 100 ? 'Exceeded by' : 'Remaining'}</span><span className={percentage >= 100 ? 'font-semibold text-danger' : 'font-semibold text-primary dark:text-[#F2F2EE]'}>{money(Math.abs(category.budgetLimit! - spent), category.budgetCurrency)}</span></div></div> : category.type === 'expense' ? <div className="border-t border-border dark:border-[#2E2E28] pt-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-secondary dark:text-[#8E8E86]">Budget</p><p className="mt-1 text-sm font-semibold text-secondary dark:text-[#8E8E86]">No budget</p><p className="mt-1 text-xs text-secondary dark:text-[#8E8E86]">No persisted budget exists for this category in the displayed period.</p></div> : null}
        <div className="border-t border-border dark:border-[#2E2E28] pt-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-secondary dark:text-[#8E8E86]">Keywords</p><div className="mt-2 flex flex-wrap gap-1.5">{category.keywords.length ? category.keywords.map((keyword) => <span key={keyword} className="rounded-full border border-border dark:border-[#2E2E28] bg-surface dark:bg-[#1A1A17] px-2 py-1 text-[11px] text-primary dark:text-[#F2F2EE]">{keyword}</span>) : <span className="text-xs text-secondary dark:text-[#8E8E86]">No keywords configured.</span>}</div></div>
        <div className="border-t border-border dark:border-[#2E2E28] pt-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-secondary dark:text-[#8E8E86]">Matching rules</p><div className="mt-2 space-y-2">{categoryRules.length ? categoryRules.map((rule) => <div key={rule.id} className="rounded-xl border border-border dark:border-[#2E2E28] bg-surface dark:bg-[#1A1A17] px-3 py-2 text-xs text-primary dark:text-[#F2F2EE]">{rule.field} {operatorLabels[rule.operator]} <span className="font-semibold">“{rule.value}”</span></div>) : <span className="text-xs text-secondary dark:text-[#8E8E86]">No local rules configured.</span>}</div></div>
      </div>
    </Modal>
  );
}
