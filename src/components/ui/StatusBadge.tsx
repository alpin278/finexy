import { cn } from '../../lib/utils';

export type StatusType = 'completed' | 'pending' | 'in_progress' | 'active' | 'inactive';

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
      dotColor: 'bg-[#55B88B]',
      textColor: 'text-[#171714]',
      bgColor: 'bg-[#FAFAF8]',
      defaultLabel: 'Completed',
    },
    pending: {
      dotColor: 'bg-[#E95E5E]',
      textColor: 'text-[#171714]',
      bgColor: 'bg-[#FAFAF8]',
      defaultLabel: 'Pending',
    },
    in_progress: {
      dotColor: 'bg-[#E8CF56]',
      textColor: 'text-[#171714]',
      bgColor: 'bg-[#FAFAF8]',
      defaultLabel: 'In Progress',
    },
    active: {
      dotColor: 'bg-[#55B88B]',
      textColor: 'text-[#27865B]',
      bgColor: 'bg-[#55B88B]/10',
      defaultLabel: 'Active',
    },
    inactive: {
      dotColor: 'bg-[#777771]',
      textColor: 'text-[#777771]',
      bgColor: 'bg-[#ECECE8]/50',
      defaultLabel: 'Inactive',
    },
  };

  const config = configs[status] || configs.completed;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-[#ECECE8]',
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
