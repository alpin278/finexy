import { useState } from 'react';
import { Card } from '../ui/Card';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BalanceCardProps {
  amount?: number;
  currency?: string;
  changePercentage?: number;
  period?: string;
  className?: string;
}

export function BalanceCard({
  amount = 689372.0,
  currency = 'USD',
  changePercentage = 5,
  period = 'than last month',
  className,
}: BalanceCardProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  const currencies = ['USD', 'EUR', 'GBP', 'IDR'];

  const formattedAmount = new Intl.NumberFormat(selectedCurrency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: selectedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <Card className={cn('p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden', className)}>
      {/* Header: Title & Currency Selector */}
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-semibold text-secondary">
          Total Balance
        </span>

        {/* Currency Selector Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface hover:bg-white text-xs font-semibold text-primary transition-colors cursor-pointer"
            aria-expanded={isCurrencyDropdownOpen}
            aria-label="Select currency"
          >
            <span>{selectedCurrency}</span>
            <ChevronDown className={cn('w-3 h-3 text-secondary transition-transform', isCurrencyDropdownOpen && 'rotate-180')} />
          </button>

          {isCurrencyDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-24 bg-white border border-border rounded-xl shadow-lg py-1 z-30 animate-in fade-in-80 duration-150">
              {currencies.map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => {
                    setSelectedCurrency(curr);
                    setIsCurrencyDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                    curr === selectedCurrency ? 'bg-surface text-primary font-semibold' : 'text-secondary hover:bg-surface hover:text-primary'
                  )}
                >
                  {curr}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Balance Display */}
      <div className="my-4">
        <h2 className="text-3xl sm:text-[34px] lg:text-[38px] font-bold text-primary tracking-tight font-sans leading-none">
          {formattedAmount}
        </h2>

        {/* Trend Indicator */}
        <div className="flex items-center gap-2 mt-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success">
            <TrendingUp className="w-3 h-3 stroke-[2.5]" />
            +{changePercentage}%
          </span>
          <span className="text-xs text-secondary">{period}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-border/60 pt-3 text-[11px] text-secondary">
        Aggregate balance snapshot · choose a display currency above
      </div>
    </Card>
  );
}

export default BalanceCard;
