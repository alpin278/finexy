import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'danger' | 'warning' | 'orange';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const variants = {
    neutral: 'bg-surface text-secondary border border-border',
    success: 'bg-success/10 text-success border border-success/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    warning: 'bg-warning/15 text-[#9E8314] border border-warning/30',
    orange: 'bg-accent/10 text-accent border border-accent/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
