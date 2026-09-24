import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'selected';
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
      'inline-flex items-center justify-center font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer active:translate-y-px active:scale-[0.99]';

    const variants = {
      primary:
        'bg-dark text-white shadow-sm hover:bg-dark-hover hover:-translate-y-px hover:shadow-card',
      accent:
        'bg-accent text-white shadow-sm hover:bg-accent-hover hover:-translate-y-px hover:shadow-card',
      secondary:
        'bg-surface text-primary border border-border hover:border-border-hover hover:bg-card hover:-translate-y-px hover:shadow-sm',
      outline:
        'border border-border bg-transparent text-primary hover:border-border-hover hover:bg-surface hover:-translate-y-px hover:shadow-sm',
      ghost:
        'bg-transparent text-secondary hover:text-primary hover:bg-surface active:bg-border/40',
      destructive:
        'border border-danger/25 bg-danger/5 text-danger hover:border-danger/40 hover:bg-danger/10 hover:-translate-y-px',
      selected:
        'border border-dark/10 bg-dark text-white shadow-sm ring-1 ring-dark/10 hover:bg-dark-hover',
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
