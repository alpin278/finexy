import { cn } from '../../lib/utils';
import type { HTMLAttributes } from 'react';

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number; // percentage (0 - 100) or current value
  max?: number;
  height?: 'sm' | 'md' | 'lg';
  color?: 'orange' | 'dark' | 'success';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  height = 'md',
  color = 'orange',
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const colors = {
    orange: 'bg-accent',
    dark: 'bg-dark',
    success: 'bg-success',
  };

  return (
    <div
      className={cn(
        'w-full bg-border rounded-full overflow-hidden relative',
        heights[height],
        className
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width,background-color] duration-300 ease-out',
          colors[color]
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
