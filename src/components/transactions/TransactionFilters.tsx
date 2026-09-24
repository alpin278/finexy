import { SearchInput } from '../ui/SearchInput';
import { Select, type SelectOption } from '../ui/Select';
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

  return (
    <div className="min-w-0 rounded-[18px] border border-border bg-white p-3 sm:p-4">
      <div className="min-w-0 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* 5 filter selectors: strictly one row on desktop (xl:flex-nowrap), deliberate grid on tablet/mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:flex xl:items-center xl:flex-nowrap gap-3 shrink-0">
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
