import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onChange, label, disabled, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'inline-flex items-center gap-2 cursor-pointer select-none',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="relative inline-flex items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded-[4px] border border-border bg-white transition-all duration-150',
              'peer-checked:bg-dark peer-checked:border-dark',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20',
              'hover:border-secondary'
            )}
          />
          <Check className="absolute w-3 h-3 text-white stroke-[2.5] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
        </div>
        {label && <span className="text-xs text-primary font-medium">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
