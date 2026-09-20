import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const variants = {
      primary:
        'bg-dark text-white hover:bg-dark-hover active:scale-[0.98] shadow-sm',
      accent:
        'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-sm',
      secondary:
        'bg-surface text-primary border border-border hover:bg-canvas active:scale-[0.98]',
      outline:
        'border border-border bg-transparent text-primary hover:bg-surface active:scale-[0.98]',
      ghost:
        'bg-transparent text-secondary hover:text-primary hover:bg-border/40 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'h-8 px-3.5 text-xs rounded-full gap-1.5',
      md: 'h-10 px-5 text-sm rounded-full gap-2',
      lg: 'h-12 px-6 text-base rounded-full gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? <Icon name="arrow-repeat" className="motion-safe:animate-spin" /> : leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
