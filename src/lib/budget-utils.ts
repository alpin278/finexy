import type { Budget, BudgetCurrencyTotal, BudgetPeriod, BudgetStatus, WalletCurrencyCode } from '../types/finance';

export const supportedBudgetCurrencies: WalletCurrencyCode[] = ['USD', 'EUR', 'GBP', 'IDR'];

export function getBudgetStatus(spent: number, limit: number): BudgetStatus {
  const ratio = limit > 0 ? spent / limit : 0;
  if (ratio >= 1) return 'over_budget';
  if (ratio >= 0.8) return 'near_limit';
  return 'on_track';
}

export function money(value: number, currency: WalletCurrencyCode = 'USD') {
  if (currency === 'IDR') return `Rp${value.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`;
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function isBudgetPeriod(value: string): value is BudgetPeriod {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function currentBudgetPeriod(date = new Date()): BudgetPeriod {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function periodStartDate(period: BudgetPeriod) {
  return `${period}-01`;
}

export function periodRange(period: BudgetPeriod) {
  const [year, month] = period.split('-').map(Number);
  const next = new Date(Date.UTC(year, month, 1));
  return {
    start: `${period}-01T00:00:00.000Z`,
    end: `${next.toISOString().slice(0, 10)}T00:00:00.000Z`,
  };
}

export function periodLabel(period: BudgetPeriod) {
  const date = new Date(`${period}-01T00:00:00.000Z`);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function groupBudgetTotals(budgets: Budget[]): BudgetCurrencyTotal[] {
  const totals = new Map<WalletCurrencyCode, BudgetCurrencyTotal>();
  for (const budget of budgets) {
    const current = totals.get(budget.currency) ?? { currency: budget.currency, limit: 0, spent: 0, remaining: 0 };
    current.limit += budget.monthlyLimit;
    current.spent += budget.spent;
    current.remaining += budget.monthlyLimit - budget.spent;
    totals.set(budget.currency, current);
  }
  return [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}
