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
  ({ className, options, icon, style, ...props }, ref) => {
    const fullWidth = className?.split(/\s+/).includes('w-full');

    return (
      <div className={cn('group relative items-center', fullWidth ? 'flex w-full' : 'inline-flex')}>
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'appearance-none h-10 min-w-0 pl-3.5 pr-10 bg-white hover:border-border-hover border border-border rounded-[12px] text-xs font-semibold text-primary shadow-[0_1px_2px_rgba(23,23,20,0.04)]',
            'transition-[border-color,box-shadow] duration-150 cursor-pointer focus:outline-none focus:bg-white focus:border-accent focus:ring-[3px] focus:ring-accent/15',
            'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-secondary disabled:opacity-70',
            'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:border-danger aria-[invalid=true]:focus:ring-danger/15',
            icon && 'pl-8',
            className
          )}
          style={{ ...style, colorScheme: 'light' }}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-secondary transition-colors duration-150 group-focus-within:text-accent" />
      </div>
    );
  }
);

Select.displayName = 'Select';
