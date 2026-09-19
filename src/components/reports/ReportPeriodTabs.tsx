import type { ReportPeriod } from '../../types/reports';
import { reportPeriodOptions } from '../../data/reports';
import { cn } from '../../lib/utils';

interface ReportPeriodTabsProps {
  activePeriod: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
}

export function ReportPeriodTabs({ activePeriod, onChange }: ReportPeriodTabsProps) {
  return (
    <div className="flex w-full max-w-full flex-wrap items-center gap-1 rounded-[14px] border border-border bg-white p-1 sm:w-auto" role="tablist" aria-label="Report period">
      {reportPeriodOptions.map((option) => {
        const isActive = activePeriod === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              'min-h-8 rounded-[10px] px-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 sm:px-3 sm:text-xs',
              isActive ? 'bg-dark text-white shadow-sm' : 'text-secondary hover:bg-surface hover:text-primary'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
