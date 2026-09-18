import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
  onFilterClick?: () => void;
  hasFilter?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, onFilterClick, hasFilter, placeholder = 'Search...', ...props }, ref) => {
    const hasValue = Boolean(value);

    return (
      <div className={cn('relative flex items-center w-full max-w-xs', className)}>
        <Search className="absolute left-3.5 w-4 h-4 text-[#777771] pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'w-full h-9 pl-9 pr-8 bg-[#FAFAF8] hover:bg-white border border-[#ECECE8] rounded-full text-xs text-[#171714]',
            'placeholder:text-[#777771] transition-all duration-150',
            'focus:outline-none focus:bg-white focus:border-[#171714] focus:ring-1 focus:ring-[#171714]'
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-0.5 rounded-full text-[#777771] hover:text-[#171714] hover:bg-[#ECECE8]/60 cursor-pointer"
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
