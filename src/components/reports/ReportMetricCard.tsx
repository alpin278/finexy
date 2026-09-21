import type { ReportSummaryMetric } from '../../types/reports';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

const icons = { savings: 'bi-percent', inflow: 'bi-arrow-down-left', outflow: 'bi-arrow-up-right', retained: 'bi-wallet2' };

export function ReportMetricCard({ metric }: { metric: ReportSummaryMetric }) {
  const positive = metric.icon !== 'outflow';
  return (
    <Card padding="none" className="flex min-h-[156px] min-w-0 flex-col justify-between overflow-hidden p-4 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary">{metric.label}</p>
          <p className="mt-3 break-words text-[clamp(1.35rem,2.4vw,1.75rem)] font-bold leading-tight tracking-[-0.04em] text-primary">{metric.value}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface text-secondary"><i className={'bi ' + icons[metric.icon]} aria-hidden="true" /></div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-border/70 pt-3">
        <span className={cn('inline-flex shrink-0 rounded-full px-2 py-1 text-[10px] font-bold', positive ? 'bg-success/12 text-success' : 'bg-accent/10 text-accent')}>{metric.accent}</span>
        <span className="min-w-0 truncate text-[10px] font-medium text-secondary">{metric.detail}</span>
      </div>
    </Card>
  );
}
