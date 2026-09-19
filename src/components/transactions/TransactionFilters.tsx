import { useState } from 'react';
import { Calendar, SlidersHorizontal } from 'lucide-react';
import { SearchInput } from '../ui/SearchInput';
import { Select, type SelectOption } from '../ui/Select';
import { cn } from '../../lib/utils';
import { transactionStatuses } from '../../data/transactions';

export interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  wallet: string;
  onWalletChange: (value: string) => void;
  datePeriod: string;
  onDatePeriodChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  categories: readonly string[];
  wallets: readonly string[];
}

const dateOptions: SelectOption[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'year-to-date', label: 'Year to Date' },
];

export function TransactionFilters({
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  wallet,
  onWalletChange,
  datePeriod,
  onDatePeriodChange,
  status,
  onStatusChange,
  categories,
  wallets,
}: TransactionFiltersProps) {
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const categoryOptions: SelectOption[] = [
    { value: 'all', label: 'All Categories' },
    ...categories.map((option) => ({ value: option, label: option })),
  ];

  const walletOptions: SelectOption[] = [
    { value: 'all', label: 'All Wallets' },
    ...wallets.map((option) => ({ value: option, label: option })),
  ];

  const statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    ...transactionStatuses,
  ];

  const hasActiveFilter = category !== 'all' || wallet !== 'all' || status !== 'all';

  return (
    <div className="min-w-0 rounded-[18px] border border-border bg-white p-3 sm:p-4">
      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mr-1">
            <Calendar className="w-4 h-4 text-secondary" />
            <Select
              aria-label="Date period"
              value={datePeriod}
              onChange={(event) => onDatePeriodChange(event.target.value)}
              options={dateOptions}
              className="max-w-[180px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowStatusFilter((open) => !open)}
            aria-expanded={showStatusFilter}
            className={cn(
              'h-8 px-3 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer',
              hasActiveFilter
                ? 'border-accent/40 bg-accent/5 text-accent'
                : 'border-border bg-surface text-secondary hover:text-primary hover:bg-canvas'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
            {hasActiveFilter && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
          </button>

          <Select
            aria-label="Category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            options={categoryOptions}
            className="max-w-[160px]"
          />
          <Select
            aria-label="Wallet"
            value={wallet}
            onChange={(event) => onWalletChange(event.target.value)}
            options={walletOptions}
            className="max-w-[175px]"
          />

          {showStatusFilter && (
            <Select
              aria-label="Status"
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              options={statusOptions}
              className="max-w-[145px]"
            />
          )}
        </div>

        <SearchInput
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          onClear={() => onSearchChange('')}
          placeholder="Search description, payee, or reference ID..."
          aria-label="Search transactions"
          className="w-full xl:w-[330px] max-w-none"
        />
      </div>
    </div>
  );
}

export default TransactionFilters;
