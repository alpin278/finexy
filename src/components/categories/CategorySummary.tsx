import { CircleAlert, Layers3, ListChecks, WalletCards } from 'lucide-react';
import type { CategorySummaryData } from '../../types/categories';
import { Card } from '../ui/Card';
import { money } from './categoryUtils';

export function CategorySummary({ summary }: { summary: CategorySummaryData }) {
  const metrics = [
    { label: 'Total categories', value: String(summary.totalCategories), detail: `${summary.expenseCategoryCount} expense · ${summary.incomeCategoryCount} income`, icon: Layers3, tone: 'text-primary bg-surface' },
    { label: 'Monthly budget cap', value: summary.monthlyBudgetCap === null ? '—' : money(summary.monthlyBudgetCap), detail: 'Temporary budget bridge', icon: WalletCards, tone: 'text-accent bg-accent/10' },
    { label: 'Auto-rule coverage', value: summary.autoRuleCoverage === null ? '—' : `${summary.autoRuleCoverage.toFixed(1)}%`, detail: 'Available after Transactions migration', icon: ListChecks, tone: 'text-success bg-success/10' },
    { label: 'Uncategorized', value: summary.uncategorizedCount === null ? '—' : `${summary.uncategorizedCount} Items`, detail: summary.uncategorizedCount === null ? 'Available after Transactions migration' : 'Requires manual review', icon: CircleAlert, tone: 'text-[#9E8314] bg-warning/15' },
  ];

  return (
    <section aria-label="Category summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
        <Card key={label} padding="md" className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">{label}</p>
              <p className="mt-2 truncate text-xl font-bold tracking-tight text-primary">{value}</p>
              <p className="mt-1 text-xs text-secondary">{detail}</p>
            </div>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
