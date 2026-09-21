import type { FinanceCategory } from '../../types/categories';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusBadge } from '../ui/StatusBadge';
import { accentSurfaceClasses, budgetStatusCopy, getCategoryBudgetStatus, money } from './categoryUtils';
import { CategoryIcon } from './CategoryIcon';
import { Icon } from '../ui/Icon';

export interface CategoryCardProps {
  category: FinanceCategory;
  matchingRuleCount: number;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CategoryCard({ category, matchingRuleCount, menuOpen, onToggleMenu, onView, onEdit, onDelete }: CategoryCardProps) {
  const hasBudget = category.type === 'expense' && category.budgetLimit !== undefined && category.budgetCurrency !== undefined;
  const spent = category.budgetSpent ?? 0;
  const usage = hasBudget ? (spent / category.budgetLimit!) * 100 : 0;
  const budgetStatus = hasBudget ? category.budgetStatus ?? getCategoryBudgetStatus(spent, category.budgetLimit!) : null;
  const remaining = hasBudget ? category.budgetLimit! - spent : 0;
  const statusCopy = budgetStatus ? budgetStatusCopy[budgetStatus] : null;

  return (
    <Card padding="md" hoverable className="relative flex min-w-0 flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${accentSurfaceClasses[category.accent]}`}>
            <CategoryIcon name={category.icon} className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-primary">{category.name}</p>
            <p className="mt-0.5 text-xs text-secondary">{hasBudget ? `${category.budgetTransactionCount ?? 0} qualifying transactions this period` : `${category.transactionCount} prototype transactions`}</p>
          </div>
        </div>
        <div className="relative shrink-0">
          <IconButton type="button" size="sm" aria-label={`Actions for ${category.name}`} aria-expanded={menuOpen} onClick={onToggleMenu}>
            <Icon name="three-dots" />
          </IconButton>
          {menuOpen && (
            <div className="menu-enter absolute right-0 top-9 z-20 w-36 rounded-xl border border-border bg-white py-1 shadow-dropdown">
              <button type="button" onClick={onView} className="w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">View Details</button>
              <button type="button" onClick={onEdit} className="w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">Edit Category</button>
              <button type="button" onClick={onDelete} className="w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger/10">Delete Category</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">{hasBudget ? 'Spent this period' : category.type === 'income' ? 'Monthly received' : 'Monthly average'}</p>
          <p className="mt-1 text-sm font-bold text-primary">{hasBudget ? money(spent, category.budgetCurrency) : money(category.monthlyAverage)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">{category.type === 'expense' ? 'Budget' : 'Matching rules'}</p>
          <p className="mt-1 text-sm font-bold text-primary">{hasBudget ? money(category.budgetLimit!, category.budgetCurrency) : category.type === 'expense' ? 'No budget' : matchingRuleCount}</p>
        </div>
      </div>

      {hasBudget && budgetStatus && statusCopy ? (
        <div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-secondary">{budgetStatus === 'over_budget' ? 'Exceeded by' : remaining === 0 ? 'Budget remaining' : 'Remaining'}</span>
            <span className={budgetStatus === 'over_budget' ? 'whitespace-nowrap font-semibold text-danger' : 'whitespace-nowrap font-semibold text-primary'}>{money(Math.abs(remaining), category.budgetCurrency)}</span>
          </div>
          <ProgressBar value={spent} max={category.budgetLimit} height="sm" color={budgetStatus === 'over_budget' ? 'dark' : 'orange'} className="mt-2" aria-label={`${category.name}: ${usage.toFixed(1)} percent used`} />
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className={budgetStatus === 'over_budget' ? 'text-xs font-bold text-danger' : 'text-xs font-bold text-primary'}>{usage.toFixed(1)}% {budgetStatus === 'over_budget' ? 'Over' : 'used'}</span>
            <Badge variant={statusCopy.variant}>{statusCopy.label}</Badge>
          </div>
        </div>
      ) : category.type === 'expense' ? (
        <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-secondary">Budget status</span>
            <span className="text-xs font-semibold text-secondary">No budget</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-secondary">Category status</span>
            <StatusBadge status={category.status} />
          </div>
        </div>
      )}

      <div className="border-t border-border pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">{category.type === 'income' ? 'Matching keywords' : 'Active rules'}</p>
          {matchingRuleCount > 0 && <span className="text-[10px] font-semibold text-secondary">{matchingRuleCount} active</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {category.keywords.slice(0, 3).map((keyword) => <span key={keyword} className="max-w-full truncate rounded-full border border-border bg-surface px-2 py-1 text-[11px] text-primary">{keyword}</span>)}
          {category.keywords.length > 3 && <span className="rounded-full border border-border bg-surface px-2 py-1 text-[11px] font-medium text-secondary">+{category.keywords.length - 3}</span>}
          {!category.keywords.length && <span className="text-xs text-secondary">No matching keywords yet.</span>}
        </div>
      </div>
    </Card>
  );
}
