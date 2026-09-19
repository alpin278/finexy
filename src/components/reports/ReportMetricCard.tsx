import { ArrowDownRight, ArrowUpRight, CircleCheck, ShieldCheck, TrendingUp, WalletCards } from 'lucide-react';
import type { ReportSummaryMetric } from '../../types/reports';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface ReportMetricCardProps {
  metric: ReportSummaryMetric;
}

function MetricIcon({ icon }: Pick<ReportSummaryMetric, 'icon'>) {
  if (icon === 'savings') return <ShieldCheck className="h-4 w-4" />;
  if (icon === 'inflow') return <ArrowUpRight className="h-4 w-4" />;
  if (icon === 'outflow') return <ArrowDownRight className="h-4 w-4" />;
  return <WalletCards className="h-4 w-4" />;
}

export function ReportMetricCard({ metric }: ReportMetricCardProps) {
  const isPositive = metric.icon !== 'outflow';

  return (
    <Card padding="none" className="flex min-h-[156px] flex-col justify-between p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary">{metric.label}</p>
          <p className="mt-3 text-[25px] font-bold tracking-[-0.04em] text-primary sm:text-[28px]">{metric.value}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface text-secondary">
          <MetricIcon icon={metric.icon} />
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 border-t border-border/70 pt-3">
        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold', isPositive ? 'bg-success/12 text-success' : 'bg-accent/10 text-accent')}>
          {metric.icon === 'savings' ? <TrendingUp className="h-3 w-3" /> : metric.icon === 'inflow' ? <CircleCheck className="h-3 w-3" /> : null}
          {metric.accent}
        </span>
        <div className="min-w-0 truncate text-[10px] font-medium text-secondary">
          <span className="block truncate">{metric.detail || metric.supportingLabel}</span>
          {metric.detail && <span className="block truncate text-[9px] text-secondary/75">{metric.supportingLabel}</span>}
        </div>
      </div>
    </Card>
  );
}
