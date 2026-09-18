import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
  onFilterClick?: () => void;
  hasFilter?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = 'Search...', ...props }, ref) => {
    const hasValue = Boolean(value);

    return (
      <div className={cn('relative flex items-center w-full max-w-xs', className)}>
        <Search className="absolute left-3.5 w-4 h-4 text-secondary pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'w-full h-9 pl-9 pr-8 bg-surface hover:bg-white border border-border rounded-full text-xs text-primary',
            'placeholder:text-secondary transition-all duration-150',
            'focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary'
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-0.5 rounded-full text-secondary hover:text-primary hover:bg-border/60 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
