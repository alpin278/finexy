import { browserTimeZone, getLocalCalendarParts } from './date-time';

export interface TransactionDateFilterBounds {
  currentYear: string;
  currentMonth: string;
  lastMonth: string;
  today: string;
}

export function getTransactionDateFilterBounds(now = new Date(), timeZone = browserTimeZone()): TransactionDateFilterBounds {
  const nowParts = getLocalCalendarParts(now, timeZone);
  const year = nowParts.year;
  const month = nowParts.month - 1; // 0-11
  const currentYear = String(year);
  const currentMonth = `${year}-${String(month + 1).padStart(2, '0')}`;

  const lastMonthDate = new Date(year, month - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const today = `${year}-${String(month + 1).padStart(2, '0')}-${String(nowParts.day).padStart(2, '0')}`;

  return { currentYear, currentMonth, lastMonth, today };
}

export function matchesTransactionDatePeriod(
  transactionDate: string,
  selectedPeriod: string,
  bounds: TransactionDateFilterBounds = getTransactionDateFilterBounds()
): boolean {
  if (selectedPeriod === 'all-dates') {
    return true;
  }
  if (selectedPeriod === 'year-to-date') {
    return transactionDate.startsWith(bounds.currentYear);
  }
  if (selectedPeriod === 'this-month') {
    return transactionDate.startsWith(bounds.currentMonth);
  }
  if (selectedPeriod === 'last-month') {
    return transactionDate.startsWith(bounds.lastMonth);
  }
  if (selectedPeriod.startsWith('month:')) {
    const targetMonth = selectedPeriod.slice(6);
    return transactionDate.startsWith(targetMonth);
  }
  if (selectedPeriod.startsWith('date:')) {
    const targetDate = selectedPeriod.slice(5);
    return transactionDate === targetDate;
  }
  if (selectedPeriod.startsWith('range:')) {
    const parts = selectedPeriod.slice(6).split(':');
    const from = parts[0];
    const to = parts[1];
    if (from && to) {
      return transactionDate >= from && transactionDate <= to;
    }
    if (from) return transactionDate >= from;
    if (to) return transactionDate <= to;
    return true;
  }
  return true;
}

export function getExportDateRangeForPeriod(
  selectedPeriod: string,
  bounds: TransactionDateFilterBounds = getTransactionDateFilterBounds()
): { dateFrom: string; dateTo: string } {
  if (selectedPeriod === 'all-dates') {
    return { dateFrom: '', dateTo: '' };
  }
  if (selectedPeriod === 'this-month') {
    const [y, m] = bounds.currentMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return { dateFrom: `${bounds.currentMonth}-01`, dateTo: `${bounds.currentMonth}-${String(lastDay).padStart(2, '0')}` };
  }
  if (selectedPeriod === 'last-month') {
    const [y, m] = bounds.lastMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return { dateFrom: `${bounds.lastMonth}-01`, dateTo: `${bounds.lastMonth}-${String(lastDay).padStart(2, '0')}` };
  }
  if (selectedPeriod === 'year-to-date') {
    return { dateFrom: `${bounds.currentYear}-01-01`, dateTo: bounds.today };
  }
  if (selectedPeriod.startsWith('month:')) {
    const targetMonth = selectedPeriod.slice(6);
    const [y, m] = targetMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return { dateFrom: `${targetMonth}-01`, dateTo: `${targetMonth}-${String(lastDay).padStart(2, '0')}` };
  }
  if (selectedPeriod.startsWith('date:')) {
    const targetDate = selectedPeriod.slice(5);
    return { dateFrom: targetDate, dateTo: targetDate };
  }
  if (selectedPeriod.startsWith('range:')) {
    const [from, to] = selectedPeriod.slice(6).split(':');
    return { dateFrom: from ?? '', dateTo: to ?? '' };
  }
  return { dateFrom: `${bounds.currentYear}-01-01`, dateTo: bounds.today };
}

export function formatPeriodDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatPeriodMonthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  if (!y || !m) return monthStr;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function getDatePeriodLabel(selectedPeriod: string): string {
  if (selectedPeriod === 'all-dates') return 'All Dates';
  if (selectedPeriod === 'this-month') return 'This Month';
  if (selectedPeriod === 'last-month') return 'Last Month';
  if (selectedPeriod === 'year-to-date') return 'Year to Date';
  if (selectedPeriod.startsWith('month:')) {
    return formatPeriodMonthLabel(selectedPeriod.slice(6));
  }
  if (selectedPeriod.startsWith('date:')) {
    return formatPeriodDateLabel(selectedPeriod.slice(5));
  }
  if (selectedPeriod.startsWith('range:')) {
    const [from, to] = selectedPeriod.slice(6).split(':');
    if (from && to) {
      if (from === to) return formatPeriodDateLabel(from);
      return `${formatPeriodDateLabel(from)} – ${formatPeriodDateLabel(to)}`;
    }
    if (from) return `From ${formatPeriodDateLabel(from)}`;
    if (to) return `Until ${formatPeriodDateLabel(to)}`;
  }
  return 'All Dates';
}
