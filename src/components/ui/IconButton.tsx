import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'active';
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      size = 'md',
      variant = 'ghost',
      children,
      disabled,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171714]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0';

    const variants = {
      primary: 'bg-[#22221C] text-white hover:bg-[#171714] active:scale-95 shadow-sm',
      secondary: 'bg-[#FAFAF8] text-[#171714] border border-[#ECECE8] hover:bg-[#ECECE8]/60 active:scale-95',
      ghost: 'bg-transparent text-[#777771] hover:text-[#171714] hover:bg-[#ECECE8]/60 active:scale-95',
      active: 'bg-[#22221C] text-white shadow-sm',
    };

    const sizes = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
    };

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
