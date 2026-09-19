import { cn } from '../../lib/utils';

export type StatusType = 'completed' | 'pending' | 'canceled' | 'in_progress' | 'active' | 'inactive';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const configs: Record<
    StatusType,
    { dotColor: string; textColor: string; bgColor: string; defaultLabel: string }
  > = {
    completed: {
      dotColor: 'bg-success',
      textColor: 'text-primary',
      bgColor: 'bg-surface',
      defaultLabel: 'Completed',
    },
    pending: {
      dotColor: 'bg-danger',
      textColor: 'text-primary',
      bgColor: 'bg-surface',
      defaultLabel: 'Pending',
    },
    canceled: {
      dotColor: 'bg-danger',
      textColor: 'text-danger',
      bgColor: 'bg-danger/10',
      defaultLabel: 'Canceled',
    },
    in_progress: {
      dotColor: 'bg-warning',
      textColor: 'text-primary',
      bgColor: 'bg-surface',
      defaultLabel: 'In Progress',
    },
    active: {
      dotColor: 'bg-success',
      textColor: 'text-success',
      bgColor: 'bg-success/10',
      defaultLabel: 'Active',
    },
    inactive: {
      dotColor: 'bg-secondary',
      textColor: 'text-secondary',
      bgColor: 'bg-border/50',
      defaultLabel: 'Inactive',
    },
  };

  const config = configs[status] || configs.completed;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotColor)} />
      <span>{displayLabel}</span>
    </span>
  );
}
