import type { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export interface TransactionSummaryCardProps {
  label: string;
  value: ReactNode;
  detail: string;
  trend?: string;
  trendTone?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
  iconTone?: 'accent' | 'success' | 'danger' | 'neutral';
}

export function TransactionSummaryCard({
  label,
  value,
  detail,
  trend,
  trendTone = 'neutral',
  icon,
  iconTone = 'neutral',
}: TransactionSummaryCardProps) {
  const iconTones = {
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
    neutral: 'bg-border/60 text-secondary',
  };

  const trendTones = {
    positive: 'text-success',
    negative: 'text-danger',
    neutral: 'text-secondary',
  };

  return (
    <Card padding="none" className="min-h-[126px] p-4 sm:p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
          {label}
        </p>
        <span className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', iconTones[iconTone])}>
          {icon}
        </span>
      </div>
      <div>
        <div className="min-w-0 text-xl font-bold tracking-tight text-primary sm:text-[22px]">{value}</div>
        <p className="text-[11px] text-secondary mt-1">
          {trend && <span className={cn('font-semibold mr-1.5', trendTones[trendTone])}>{trend}</span>}
          {detail}
        </p>
      </div>
    </Card>
  );
}

export default TransactionSummaryCard;
