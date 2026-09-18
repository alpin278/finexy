import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'danger' | 'warning' | 'orange';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const variants = {
    neutral: 'bg-[#FAFAF8] text-[#777771] border border-[#ECECE8]',
    success: 'bg-[#55B88B]/10 text-[#27865B] border border-[#55B88B]/20',
    danger: 'bg-[#E95E5E]/10 text-[#C93838] border border-[#E95E5E]/20',
    warning: 'bg-[#E8CF56]/15 text-[#9E8314] border border-[#E8CF56]/30',
    orange: 'bg-[#FF5A36]/10 text-[#FF5A36] border border-[#FF5A36]/20',
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
