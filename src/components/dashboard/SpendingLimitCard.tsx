import { Card } from '../ui/Card';
import type { SpendingLimit } from '../../types/finance';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SpendingLimitCardProps {
  data?: SpendingLimit;
  onViewBudget?: () => void;
  className?: string;
}

export function SpendingLimitCard({
  data = { spent: 1400.0, totalLimit: 5500.0, period: 'Monthly' },
  onViewBudget,
  className,
}: SpendingLimitCardProps) {
  const percentage = Math.min(100, Math.round((data.spent / data.totalLimit) * 100));

  return (
    <Card className={cn('p-5 sm:p-6 flex flex-col justify-between', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-primary">Monthly Budget Progress</h3>
        </div>

        <button
          type="button"
          aria-label="View budgets"
          onClick={onViewBudget}
          className="w-7 h-7 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-surface transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Figures */}
      <div className="my-3">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl sm:text-[28px] font-bold text-primary tracking-tight font-sans">
            ${data.spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs sm:text-sm text-secondary font-medium">
            spent out of ${data.totalLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Custom Progress Bar with Patterned Remaining Track */}
        <div className="mt-3.5 relative w-full h-4 rounded-full overflow-hidden bg-border/60 p-0.5 flex items-center">
          {/* Patterned remaining background track using pure CSS diagonal stripes */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                #ECECE8,
                #ECECE8 6px,
                #FAFAF8 6px,
                #FAFAF8 12px
              )`,
            }}
          />

          {/* Active progress fill */}
          <div
            className="relative h-full bg-accent rounded-full transition-all duration-500 ease-out shadow-xs flex items-center justify-end pr-1"
            style={{ width: `${percentage}%` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-secondary pt-1">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-accent" />
          <span>{percentage}% of monthly budget used</span>
        </div>
        <span className="font-semibold text-primary">
          ${(data.totalLimit - data.spent).toLocaleString('en-US', { minimumFractionDigits: 0 })} left
        </span>
      </div>
    </Card>
  );
}

export default SpendingLimitCard;
