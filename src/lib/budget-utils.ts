import type { Budget, BudgetCurrencyTotal, BudgetPeriod, BudgetStatus, WalletCurrencyCode } from '../types/finance';
import { browserTimeZone, formatMonthKey, getLocalCalendarParts, zonedDateTimeToIso } from './date-time';

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

export function currentBudgetPeriod(date = new Date(), timeZone = browserTimeZone()): BudgetPeriod {
  const parts = getLocalCalendarParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}`;
}

export function periodStartDate(period: BudgetPeriod) {
  return `${period}-01`;
}

export function periodRange(period: BudgetPeriod, timeZone = browserTimeZone()) {
  const [year, month] = period.split('-').map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    start: zonedDateTimeToIso(`${period}-01`, '00:00:00', timeZone),
    end: zonedDateTimeToIso(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01`, '00:00:00', timeZone),
  };
}

export function periodLabel(period: BudgetPeriod) {
  return formatMonthKey(period);
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
