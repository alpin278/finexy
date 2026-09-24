import { Card } from '../ui/Card';
import type { OverviewMetric } from '../../lib/overview';
import { formatWalletAmount } from '../../lib/overview';
import type { WalletCurrencyCode } from '../../types/finance';
import { cn } from '../../lib/utils';
import { AmountValue } from '../ui/AmountValue';

const icons: Record<OverviewMetric['id'], string> = {
  income: 'bi-arrow-down-left',
  expenses: 'bi-arrow-up-right',
  'net-cash-flow': 'bi-activity',
  'savings-rate': 'bi-percent',
};

const labels: Record<OverviewMetric['id'], string> = {
  income: 'Inflow',
  expenses: 'Outflow',
  'net-cash-flow': 'Cash flow',
  'savings-rate': 'Efficiency',
};

export interface MetricCardProps {
  metric: OverviewMetric;
  currency: WalletCurrencyCode;
  className?: string;
}

export function MetricCard({ metric, currency, className }: MetricCardProps) {
  const highlighted = metric.id === 'income';
  const formatted = metric.format === 'percentage' ? metric.amount.toFixed(1) + '%' : formatWalletAmount(metric.amount, currency);

  return (
    <Card
      className={cn(
        'grid min-h-[148px] min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-4 transition-[border-color,box-shadow,transform] duration-200 sm:p-5',
        highlighted ? 'border-accent/25 bg-accent/[0.06] shadow-card' : 'border-border bg-card',
        className
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="min-w-0 truncate text-xs font-medium text-secondary sm:text-sm">{metric.title}</span>
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', highlighted ? 'bg-accent/12 text-accent' : 'bg-surface text-secondary')}>
          <i className={'bi ' + icons[metric.id] + ' text-sm'} aria-hidden="true" />
        </span>
      </div>
      <div className="my-3 flex min-w-0 items-center">
        <AmountValue value={formatted} className="font-sans text-[clamp(1.1rem,1.8vw,1.7rem)] font-bold leading-tight tracking-[-0.035em] text-primary" />
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold', metric.isPositive ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger')}>
          <i className={'bi ' + (metric.isPositive ? 'bi-arrow-up-right' : 'bi-arrow-down-right')} aria-hidden="true" />
          <span>{labels[metric.id]}</span>
        </span>
        <span className="truncate text-[11px] text-secondary">{metric.trendLabel}</span>
      </div>
    </Card>
  );
}

export default MetricCard;
