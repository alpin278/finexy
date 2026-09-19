import { Card } from '../ui/Card';
import { ArrowUpRight, Tags } from 'lucide-react';

export interface SpendingInsight {
  id: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

interface SpendingInsightCardProps {
  categories: readonly SpendingInsight[];
  className?: string;
}

export function SpendingInsightCard({ categories, className }: SpendingInsightCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent"><Tags className="h-4 w-4" aria-hidden="true" /></div>
          <div><h3 className="text-sm font-bold text-primary">Spending by category</h3><p className="mt-0.5 text-xs text-secondary">Where this month’s outflow is concentrated</p></div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-secondary" aria-hidden="true" />
      </div>
      <div className="mt-5 space-y-4">
        {categories.map((category) => (
          <div key={category.id}>
            <div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium text-primary">{category.label}</span><span className="font-semibold text-secondary">${category.amount.toLocaleString()}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/60" role="progressbar" aria-label={`${category.label} share of spending`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={category.percentage}>
              <div className="h-full rounded-full" style={{ width: `${category.percentage}%`, backgroundColor: category.color }} />
            </div>
            <p className="mt-1 text-[11px] text-secondary">{category.percentage}% of mock monthly spending</p>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-secondary">Category values are product-level mock aggregates; use Categories for detailed rules and budgets.</p>
    </Card>
  );
}
