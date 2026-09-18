import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  icon?: ReactNode;
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
            'appearance-none h-8 pl-3 pr-8 bg-surface hover:bg-canvas border border-border rounded-full text-xs font-medium text-primary',
            'transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary',
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
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';
