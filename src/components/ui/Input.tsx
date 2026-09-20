import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-10 px-3.5 bg-white border border-border rounded-[12px] text-sm text-primary',
            'placeholder:text-secondary/70 transition-[border-color,background-color,box-shadow] duration-150',
            'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
            'disabled:bg-surface disabled:cursor-not-allowed disabled:text-secondary',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/15',
            className
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary flex items-center justify-center">
            {rightIcon}
          </div>
        )}
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
