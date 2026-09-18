import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, icon, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'appearance-none h-8 pl-3 pr-8 bg-[#FAFAF8] hover:bg-[#F2F2F0] border border-[#ECECE8] rounded-full text-xs font-medium text-[#171714]',
            'transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#171714]',
            icon && 'pl-8',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#777771] pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';
