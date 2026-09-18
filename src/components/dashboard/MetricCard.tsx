import { Card } from '../ui/Card';
import type { MetricData } from '../../types/finance';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownLeft, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MetricCardProps {
  metric: MetricData;
  className?: string;
}

export function MetricCard({ metric, className }: MetricCardProps) {
  const isPositive = metric.changePercentage >= 0;
  const isHighlighted = Boolean(metric.highlighted);

  // Icon mapping based on metric id
  const getIcon = () => {
    switch (metric.id) {
      case 'earnings':
        return <DollarSign className="w-4 h-4" />;
      case 'spending':
        return <ArrowDownLeft className="w-4 h-4" />;
      case 'income':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'revenue':
        return <Activity className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <Card
      className={cn(
        'p-4 sm:p-5 flex flex-col justify-between transition-all duration-200',
        isHighlighted
          ? 'bg-accent text-white border-transparent shadow-[0_10px_25px_-5px_rgba(255,90,54,0.3)]'
          : 'bg-white text-primary border-border hover:border-border/80',
        className
      )}
    >
      {/* Top: Icon + Title */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            'text-xs sm:text-sm font-medium',
            isHighlighted ? 'text-white/90' : 'text-secondary'
          )}
        >
          {metric.title}
        </span>

        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center',
            isHighlighted ? 'bg-white/20 text-white' : 'bg-surface text-secondary'
          )}
        >
          {getIcon()}
        </div>
      </div>

      {/* Center: Amount */}
      <div className="my-1">
        <span className="text-2xl sm:text-[28px] font-bold tracking-tight font-sans">
          ${metric.amount.toLocaleString()}
        </span>
      </div>

      {/* Bottom: Trend & Period */}
      <div className="flex items-center gap-1.5 mt-2">
        <span
          className={cn(
            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold',
            isHighlighted
              ? 'bg-white/20 text-white'
              : isPositive
                ? 'bg-success/15 text-success'
                : 'bg-danger/15 text-danger'
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3 stroke-[2.5]" />
          ) : (
            <TrendingDown className="w-3 h-3 stroke-[2.5]" />
          )}
          <span>
            {isPositive ? `+${metric.changePercentage}%` : `${metric.changePercentage}%`}
          </span>
        </span>

        <span
          className={cn(
            'text-[11px]',
            isHighlighted ? 'text-white/80' : 'text-secondary'
          )}
        >
          {metric.period}
        </span>
      </div>
    </Card>
  );
}

export default MetricCard;
