import { useNavigate } from 'react-router-dom';
import { SearchInput } from '../ui/SearchInput';
import { Select, type SelectOption } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { transactionStatuses } from '../../data/transactions';
import type { CurrencyCode, WalletCurrencyCode } from '../../types/finance';
import { TransactionDateFilter } from './TransactionDateFilter';

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
  currency: 'all' | CurrencyCode;
  onCurrencyChange: (value: 'all' | CurrencyCode) => void;
  currencies: readonly CurrencyCode[];
  reportingCurrency: WalletCurrencyCode;
}

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
  currency,
  onCurrencyChange,
  currencies,
  reportingCurrency,
}: TransactionFiltersProps) {
  const navigate = useNavigate();
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

  const currencyOptions: SelectOption[] = [
    { value: reportingCurrency, label: `Reporting · ${reportingCurrency}` },
    { value: 'all', label: 'All Currencies' },
    ...currencies.filter((item) => item !== reportingCurrency).map((item) => ({ value: item, label: item })),
  ];
  const activeFilterCount = [currency !== 'all', datePeriod !== 'all-dates', category !== 'all', wallet !== 'all', status !== 'all'].filter(Boolean).length;
  const resetFilters = () => {
    onCurrencyChange('all');
    onDatePeriodChange('all-dates');
    onCategoryChange('all');
    onWalletChange('all');
    onStatusChange('all');
  };

  return (
    <div className="min-w-0 rounded-[18px] border border-border bg-card p-3 sm:p-4">
      <div className="sm:hidden space-y-2">
        <SearchInput value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} onClear={() => onSearchChange('')} placeholder="Search transactions" aria-label="Search transactions" className="w-full" />
        <details className="group rounded-xl border border-border bg-surface/60">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-semibold text-primary"><span className="flex items-center gap-2"><Icon name="sliders" />Filters{activeFilterCount ? ` · ${activeFilterCount}` : ''}</span><Icon name="chevron-down" className="transition-transform group-open:rotate-180" /></summary>
          <div className="grid gap-2 border-t border-border p-3">
            <Select aria-label="Activity currency" value={currency} onChange={(event) => onCurrencyChange(event.target.value as 'all' | CurrencyCode)} options={currencyOptions} className="w-full" />
            <TransactionDateFilter value={datePeriod} onChange={onDatePeriodChange} className="w-full" />
            <Select aria-label="Category" value={category} onChange={(event) => onCategoryChange(event.target.value)} options={categoryOptions} action={{ label: 'Manage Categories', icon: <Icon name="tags" />, onSelect: () => navigate('/settings#categories') }} className="w-full" />
            <Select aria-label="Wallet" value={wallet} onChange={(event) => onWalletChange(event.target.value)} options={walletOptions} className="w-full" />
            <Select aria-label="Status" value={status} onChange={(event) => onStatusChange(event.target.value)} options={statusOptions} className="w-full" />
            <button type="button" onClick={resetFilters} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-secondary hover:bg-card">Reset filters</button>
          </div>
        </details>
      </div>
      <div className="hidden min-w-0 sm:flex sm:flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:flex xl:items-center xl:flex-nowrap gap-3 shrink-0">
          <Select
            aria-label="Activity currency"
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value as 'all' | CurrencyCode)}
            options={currencyOptions}
            className="w-full xl:w-[148px]"
          />

          <TransactionDateFilter
            value={datePeriod}
            onChange={onDatePeriodChange}
            className="w-full xl:w-[168px]"
          />

          <Select
            aria-label="Category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            options={categoryOptions}
            action={{
              label: 'Manage Categories',
              icon: <Icon name="tags" />,
              onSelect: () => navigate('/settings#categories'),
            }}
            className="w-full xl:w-[158px]"
          />

          <Select
            aria-label="Wallet"
            value={wallet}
            onChange={(event) => onWalletChange(event.target.value)}
            options={walletOptions}
            className="w-full xl:w-[148px]"
          />

          <Select
            aria-label="Status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            options={statusOptions}
            className="w-full xl:w-[130px]"
          />
        </div>

        {/* Search input: bounded on desktop, perfectly inside card padding without clipping */}
        <div className="min-w-0 w-full xl:w-auto xl:flex-1 xl:min-w-0 xl:max-w-[320px] xl:ml-auto">
          <SearchInput
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            onClear={() => onSearchChange('')}
            placeholder="Search description, payee, or reference ID..."
            aria-label="Search transactions"
            className="w-full max-w-none"
          />
        </div>
      </div>
    </div>
  );
}

export default TransactionFilters;
