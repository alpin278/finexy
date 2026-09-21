import type { ReportPeriod } from '../../types/reports';
import { reportPeriodOptions } from '../../data/reports';
import { cn } from '../../lib/utils';

interface ReportPeriodTabsProps {
  activePeriod: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
}

export function ReportPeriodTabs({ activePeriod, onChange }: ReportPeriodTabsProps) {
  return (
    <div className="isolate flex w-full max-w-full flex-wrap items-center gap-1 overflow-hidden rounded-[14px] border border-border bg-white p-1 sm:w-auto" role="tablist" aria-label="Report period">
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
              'min-h-8 rounded-[10px] px-2.5 text-[11px] font-semibold transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 sm:px-3 sm:text-xs',
              isActive ? 'border border-dark/10 bg-dark text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(23,23,20,0.12)]' : 'border border-transparent text-secondary hover:bg-surface hover:text-primary'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
