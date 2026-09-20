import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

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
    const fullWidth = className?.split(/\s+/).includes('w-full');

    return (
      <div className={cn('relative items-center', fullWidth ? 'flex w-full' : 'inline-flex')}>
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'appearance-none h-8 pl-3 pr-8 bg-surface hover:bg-canvas border border-border rounded-full text-xs font-medium text-primary',
            'transition-[background-color,border-color,color,box-shadow] duration-150 cursor-pointer focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
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
        <Icon name="chevron-down" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-secondary pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';
