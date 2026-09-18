import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777771] pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-10 px-3.5 bg-white border border-[#ECECE8] rounded-[12px] text-sm text-[#171714]',
            'placeholder:text-[#777771]/70 transition-all duration-150',
            'focus:outline-none focus:border-[#171714] focus:ring-1 focus:ring-[#171714]',
            'disabled:bg-[#FAFAF8] disabled:cursor-not-allowed disabled:text-[#777771]',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-[#E95E5E] focus:border-[#E95E5E] focus:ring-[#E95E5E]',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777771] flex items-center justify-center">
            {rightIcon}
          </div>
        )}
        {error && <p className="mt-1 text-xs text-[#E95E5E]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
