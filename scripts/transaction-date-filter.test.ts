import assert from 'node:assert/strict';
import { occurredAtForTransactionDate } from '../src/lib/transaction-timestamp';
import {
  getTransactionDateFilterBounds,
  matchesTransactionDatePeriod,
  getExportDateRangeForPeriod,
  getDatePeriodLabel,
  formatPeriodDateLabel,
  formatPeriodMonthLabel,
} from '../src/lib/transaction-date-filter';

// 1. occurredAtForTransactionDate preserves selected date and recording time
{
  const ref = new Date('2026-09-21T16:25:30.456Z');
  const result = occurredAtForTransactionDate('2026-09-21', ref);
  assert.equal(result, '2026-09-21T16:25:30.456Z', 'matches canonical timestamp');

  // Fallback on invalid date
  assert.equal(occurredAtForTransactionDate('', ref), ref.toISOString(), 'falls back to now on invalid input');
}

// 2. getTransactionDateFilterBounds
{
  const testDate = new Date(2026, 8, 23); // September 23, 2026 (month is 0-indexed)
  const bounds = getTransactionDateFilterBounds(testDate);
  assert.equal(bounds.currentYear, '2026');
  assert.equal(bounds.currentMonth, '2026-09');
  assert.equal(bounds.lastMonth, '2026-08');
  assert.equal(bounds.today, '2026-09-23');

  // Year/month boundary test: January 2026
  const janDate = new Date(2026, 0, 15);
  const janBounds = getTransactionDateFilterBounds(janDate);
  assert.equal(janBounds.currentYear, '2026');
  assert.equal(janBounds.currentMonth, '2026-01');
  assert.equal(janBounds.lastMonth, '2025-12');
  assert.equal(janBounds.today, '2026-01-15');
}

// 3. matchesTransactionDatePeriod
{
  const bounds = {
    currentYear: '2026',
    currentMonth: '2026-09',
    lastMonth: '2026-08',
    today: '2026-09-23',
  };

  // All Dates mode
  assert.equal(matchesTransactionDatePeriod('2026-09-22', 'all-dates', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2025-01-01', 'all-dates', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-12-22', 'all-dates', bounds), true);

  // Current month transaction
  assert.equal(matchesTransactionDatePeriod('2026-09-22', 'year-to-date', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-09-22', 'this-month', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-09-22', 'last-month', bounds), false);

  // Logical consistency check: Any transaction in this-month MUST match year-to-date
  const sampleDates = ['2026-09-01', '2026-09-15', '2026-09-22', '2026-09-30'];
  for (const date of sampleDates) {
    const isThisMonth = matchesTransactionDatePeriod(date, 'this-month', bounds);
    const isYtd = matchesTransactionDatePeriod(date, 'year-to-date', bounds);
    assert.equal(isThisMonth, true);
    assert.equal(isYtd, true, `Date ${date} in this-month must also be in year-to-date`);
  }

  // Last month transaction
  assert.equal(matchesTransactionDatePeriod('2026-08-15', 'year-to-date', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-08-15', 'this-month', bounds), false);
  assert.equal(matchesTransactionDatePeriod('2026-08-15', 'last-month', bounds), true);

  // Prior year transaction
  assert.equal(matchesTransactionDatePeriod('2025-12-31', 'year-to-date', bounds), false);
  assert.equal(matchesTransactionDatePeriod('2025-12-31', 'this-month', bounds), false);
  assert.equal(matchesTransactionDatePeriod('2025-12-31', 'last-month', bounds), false);

  // Select Month mode (month:YYYY-MM)
  assert.equal(matchesTransactionDatePeriod('2026-07-14', 'month:2026-07', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-08-01', 'month:2026-07', bounds), false);
  assert.equal(matchesTransactionDatePeriod('2025-07-14', 'month:2026-07', bounds), false);

  // Select Date mode (date:YYYY-MM-DD)
  assert.equal(matchesTransactionDatePeriod('2026-09-22', 'date:2026-09-22', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-09-23', 'date:2026-09-22', bounds), false);

  // Custom Range mode (range:from:to)
  assert.equal(matchesTransactionDatePeriod('2026-09-10', 'range:2026-09-01:2026-09-15', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-09-01', 'range:2026-09-01:2026-09-15', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-09-15', 'range:2026-09-01:2026-09-15', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-09-16', 'range:2026-09-01:2026-09-15', bounds), false);
  assert.equal(matchesTransactionDatePeriod('2026-08-31', 'range:2026-09-01:2026-09-15', bounds), false);

  // Unrecognised period should not drop transactions
  assert.equal(matchesTransactionDatePeriod('2025-12-31', 'all', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-09-22', 'custom', bounds), true);
}

// 4. getExportDateRangeForPeriod
{
  const bounds = {
    currentYear: '2026',
    currentMonth: '2026-09',
    lastMonth: '2026-08',
    today: '2026-09-23',
  };

  const allDatesExport = getExportDateRangeForPeriod('all-dates', bounds);
  assert.equal(allDatesExport.dateFrom, '');
  assert.equal(allDatesExport.dateTo, '');

  const thisMonthExport = getExportDateRangeForPeriod('this-month', bounds);
  assert.equal(thisMonthExport.dateFrom, '2026-09-01');
  assert.equal(thisMonthExport.dateTo, '2026-09-30', 'this-month export covers entire month');

  const lastMonthExport = getExportDateRangeForPeriod('last-month', bounds);
  assert.equal(lastMonthExport.dateFrom, '2026-08-01');
  assert.equal(lastMonthExport.dateTo, '2026-08-31', 'last-month export covers entire 31-day month');

  const ytdExport = getExportDateRangeForPeriod('year-to-date', bounds);
  assert.equal(ytdExport.dateFrom, '2026-01-01');
  assert.equal(ytdExport.dateTo, '2026-09-23');

  const monthExport = getExportDateRangeForPeriod('month:2026-02', bounds);
  assert.equal(monthExport.dateFrom, '2026-02-01');
  assert.equal(monthExport.dateTo, '2026-02-28');

  const singleDateExport = getExportDateRangeForPeriod('date:2026-09-22', bounds);
  assert.equal(singleDateExport.dateFrom, '2026-09-22');
  assert.equal(singleDateExport.dateTo, '2026-09-22');

  const rangeExport = getExportDateRangeForPeriod('range:2026-05-01:2026-05-15', bounds);
  assert.equal(rangeExport.dateFrom, '2026-05-01');
  assert.equal(rangeExport.dateTo, '2026-05-15');
}

// 5. getDatePeriodLabel and helpers
{
  assert.equal(formatPeriodDateLabel('2026-09-22'), 'Sep 22, 2026');
  assert.equal(formatPeriodMonthLabel('2026-09'), 'Sep 2026');

  assert.equal(getDatePeriodLabel('all-dates'), 'All Dates');
  assert.equal(getDatePeriodLabel('this-month'), 'This Month');
  assert.equal(getDatePeriodLabel('last-month'), 'Last Month');
  assert.equal(getDatePeriodLabel('year-to-date'), 'Year to Date');
  assert.equal(getDatePeriodLabel('month:2026-09'), 'Sep 2026');
  assert.equal(getDatePeriodLabel('date:2026-09-22'), 'Sep 22, 2026');
  assert.equal(getDatePeriodLabel('range:2026-09-01:2026-09-15'), 'Sep 1, 2026 – Sep 15, 2026');
}

console.log('transaction-date-filter checks passed');
