import { cn } from '../../lib/utils';

export interface ProgressBarProps {
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
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const colors = {
    orange: 'bg-[#FF5A36]',
    dark: 'bg-[#22221C]',
    success: 'bg-[#55B88B]',
  };

  return (
    <div
      className={cn(
        'w-full bg-[#ECECE8] rounded-full overflow-hidden relative',
        heights[height],
        className
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300 ease-out',
          colors[color]
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
