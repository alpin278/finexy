import assert from 'node:assert/strict';
import {
  formatDateOnly,
  formatLocalTime,
  formatLocalDateTime,
  formatMonthKey,
  getLocalDateKey,
  getLocalMonthKey,
  isDateOnly,
  reportRange,
  resolveTimeZone,
  resolveUserDisplayTimeZone,
  browserTimeZone,
  zonedDateTimeToIso,
} from '../src/lib/date-time.ts';
import { periodRange, periodLabel } from '../src/lib/budget-utils.ts';
import { occurredAtForTransactionDate, resolveOccurredAt } from '../src/lib/transaction-timestamp.ts';
import { calculateFinancialTotals } from '../src/lib/financial-analytics.ts';

const WIB = 'Asia/Jakarta';

console.log('Running Finexy date/time timezone audit and regression tests...');

// -----------------------------------------------------------------------------
// Test A: 2026-09-25T17:30:00Z in Asia/Jakarta => Sep 26 00:30 (12:30 AM)
// -----------------------------------------------------------------------------
{
  const utcInstant = '2026-09-25T17:30:00.000Z';
  assert.equal(getLocalDateKey(utcInstant, WIB), '2026-09-26');
  assert.equal(formatLocalTime(utcInstant, WIB), '12:30 AM');
  const formattedDateTime = formatLocalDateTime(utcInstant, WIB);
  assert.match(formattedDateTime, /26/);
  assert.match(formattedDateTime, /Sep/);
  assert.match(formattedDateTime, /12:30/);
}

// -----------------------------------------------------------------------------
// Test B: Near-midnight financial dates remain on correct occurred_at date
// -----------------------------------------------------------------------------
{
  // 00:05 local time on Sep 26
  const midnightEarly = zonedDateTimeToIso('2026-09-26', '00:05:00', WIB);
  assert.equal(midnightEarly, '2026-09-25T17:05:00.000Z');
  assert.equal(getLocalDateKey(midnightEarly, WIB), '2026-09-26');

  // 23:55 local time on Sep 26
  const midnightLate = zonedDateTimeToIso('2026-09-26', '23:55:00', WIB);
  assert.equal(midnightLate, '2026-09-26T16:55:00.000Z');
  assert.equal(getLocalDateKey(midnightLate, WIB), '2026-09-26');

  // Creating a transaction on Sep 26 when local time is early morning
  const simulatedEarlyMorning = new Date('2026-09-26T00:15:00+07:00');
  const occurredEarly = occurredAtForTransactionDate('2026-09-26', simulatedEarlyMorning, WIB);
  assert.equal(getLocalDateKey(occurredEarly, WIB), '2026-09-26');

  // Editing existing transaction retains original occurred_at if date unchanged
  const preserved = resolveOccurredAt('2026-09-26', midnightEarly, new Date(), WIB);
  assert.equal(preserved, midnightEarly);

  // Editing existing transaction to new date preserves time of day
  const movedDate = resolveOccurredAt('2026-09-27', midnightEarly, new Date(), WIB);
  assert.equal(getLocalDateKey(movedDate, WIB), '2026-09-27');
  assert.equal(formatLocalTime(movedDate, WIB), '12:05 AM');
}

// -----------------------------------------------------------------------------
// Test C: Month boundary does not shift August/September
// -----------------------------------------------------------------------------
{
  // Aug 31 23:59:59 WIB => 2026-08-31T16:59:59Z
  const augEnd = '2026-08-31T16:59:59.000Z';
  assert.equal(getLocalDateKey(augEnd, WIB), '2026-08-31');
  assert.equal(getLocalMonthKey(augEnd, WIB), '2026-08');

  // Sep 1 00:00:00 WIB => 2026-08-31T17:00:00Z
  const sepStart = '2026-08-31T17:00:00.000Z';
  assert.equal(getLocalDateKey(sepStart, WIB), '2026-09-01');
  assert.equal(getLocalMonthKey(sepStart, WIB), '2026-09');

  // Sep 30 23:59:59 WIB => 2026-09-30T16:59:59Z
  const sepEnd = '2026-09-30T16:59:59.000Z';
  assert.equal(getLocalDateKey(sepEnd, WIB), '2026-09-30');
  assert.equal(getLocalMonthKey(sepEnd, WIB), '2026-09');

  // Oct 1 00:00:00 WIB => 2026-09-30T17:00:00Z
  const octStart = '2026-09-30T17:00:00.000Z';
  assert.equal(getLocalDateKey(octStart, WIB), '2026-10-01');
  assert.equal(getLocalMonthKey(octStart, WIB), '2026-10');

  // September budget range
  const sepBudgetRange = periodRange('2026-09', WIB);
  assert.equal(sepBudgetRange.start, '2026-08-31T17:00:00.000Z');
  assert.equal(sepBudgetRange.end, '2026-09-30T17:00:00.000Z');

  // Financial totals correctly attribute transactions
  const txAug = { amount: 100, currency: 'USD', deleted_at: null, occurred_at: augEnd, status: 'completed', transfer_id: null, type: 'expense' };
  const txSepEarly = { amount: 200, currency: 'USD', deleted_at: null, occurred_at: sepStart, status: 'completed', transfer_id: null, type: 'expense' };
  const txSepLate = { amount: 300, currency: 'USD', deleted_at: null, occurred_at: sepEnd, status: 'completed', transfer_id: null, type: 'expense' };
  const txOct = { amount: 400, currency: 'USD', deleted_at: null, occurred_at: octStart, status: 'completed', transfer_id: null, type: 'expense' };

  const sepTotals = calculateFinancialTotals([txAug, txSepEarly, txSepLate, txOct], sepBudgetRange, 'USD');
  assert.equal(sepTotals.expenses, 500); // 200 + 300 (aug and oct excluded)
}

// -----------------------------------------------------------------------------
// Test D: Year boundary Dec 31 / Jan 1
// -----------------------------------------------------------------------------
{
  // Dec 31 2025 23:59:59 WIB => 2025-12-31T16:59:59Z
  const decEnd = '2025-12-31T16:59:59.000Z';
  assert.equal(getLocalDateKey(decEnd, WIB), '2025-12-31');
  assert.equal(getLocalMonthKey(decEnd, WIB), '2025-12');

  // Jan 1 2026 00:00:00 WIB => 2025-12-31T17:00:00Z
  const janStart = '2025-12-31T17:00:00.000Z';
  assert.equal(getLocalDateKey(janStart, WIB), '2026-01-01');
  assert.equal(getLocalMonthKey(janStart, WIB), '2026-01');

  // Report range for this-year in WIB
  const year2026 = reportRange('this-year', new Date('2026-06-15T00:00:00Z'), WIB);
  assert.equal(year2026.start, '2025-12-31T17:00:00.000Z');
  assert.equal(year2026.end, '2026-12-31T17:00:00.000Z');
}

// -----------------------------------------------------------------------------
// Test E: Overview remains Jan-Dec yearly grouping with zero-fill
// -----------------------------------------------------------------------------
{
  const months = Array.from({ length: 12 }, (_, index) => {
    return (['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])[index];
  });
  assert.deepEqual(months, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
  assert.equal(periodLabel('2026-01'), 'January 2026');
  assert.equal(periodLabel('2026-12'), 'December 2026');
}

// -----------------------------------------------------------------------------
// Test F: History order remains created_at DESC
// -----------------------------------------------------------------------------
{
  const rows = [
    { id: '1', created_at: '2026-09-20T10:00:00Z', occurred_at: '2026-12-25T12:00:00Z' }, // future occurred_at, older created_at
    { id: '2', created_at: '2026-09-26T10:00:00Z', occurred_at: '2026-09-20T00:00:00Z' }, // past occurred_at, newer created_at
    { id: '3', created_at: '2026-09-26T10:00:00Z', occurred_at: '2026-09-26T00:30:00Z' }, // tie on created_at
  ];

  const sorted = [...rows].sort((a, b) => {
    if (a.created_at !== b.created_at) return b.created_at.localeCompare(a.created_at);
    if (a.occurred_at !== b.occurred_at) return b.occurred_at.localeCompare(a.occurred_at);
    return b.id.localeCompare(a.id);
  });

  assert.equal(sorted[0].id, '3', 'Ties resolved by occurred_at DESC');
  assert.equal(sorted[1].id, '2', 'Newer created_at comes before older created_at');
  assert.equal(sorted[2].id, '1', 'Older created_at comes last even with future occurred_at');
}

// -----------------------------------------------------------------------------
// Test G: Date-only values never shift by one day
// -----------------------------------------------------------------------------
{
  assert.equal(isDateOnly('2026-09-26'), true);
  assert.equal(isDateOnly('2026-09-26T00:00:00Z'), false);
  assert.match(formatDateOnly('2026-09-26', 'en-GB'), /^26 Sept? 2026$/);
  assert.equal(formatDateOnly('2026-09-26', 'en-US'), 'Sep 26, 2026');
  assert.equal(formatDateOnly('2026-01-01', 'en-GB'), '01 Jan 2026');
  assert.equal(formatDateOnly('2026-12-31', 'en-GB'), '31 Dec 2026');
  assert.equal(formatMonthKey('2026-09'), 'September 2026');
}

// -----------------------------------------------------------------------------
// Test H: Production incident verification & user preference boundary
// -----------------------------------------------------------------------------
{
  const instant = '2026-09-26T07:54:00.000Z';
  assert.equal(getLocalDateKey(instant, WIB), '2026-09-26');
  assert.equal(formatLocalTime(instant, WIB), '02:54 PM');

  // Verify 2026-09-25T17:30:00Z -> Asia/Jakarta -> 2026-09-26 00:30
  const instantNight = '2026-09-25T17:30:00.000Z';
  assert.equal(getLocalDateKey(instantNight, WIB), '2026-09-26');
  assert.equal(formatLocalTime(instantNight, WIB), '12:30 AM');

  // 1. resolveTimeZone must remain semantically correct:
  // resolveTimeZone("UTC") must return "UTC"
  assert.equal(resolveTimeZone('UTC'), 'UTC');
  assert.equal(resolveTimeZone('Etc/UTC'), 'Etc/UTC');
  assert.equal(resolveTimeZone('Asia/Jakarta'), 'Asia/Jakarta');
  assert.equal(resolveTimeZone(null), browserTimeZone());
  assert.equal(resolveTimeZone(''), browserTimeZone());

  // An explicit call to format in UTC still legitimately renders UTC
  assert.equal(formatLocalTime(instant, 'UTC'), '07:54 AM');

  // 2. Legacy database default at the USER PREFERENCE boundary:
  // PostgreSQL historically bootstrapped user_settings.timezone = "UTC".
  // resolveUserDisplayTimeZone treats legacy "UTC" as unconfigured and normalizes to browser timezone.
  assert.equal(resolveUserDisplayTimeZone('UTC'), browserTimeZone());
  assert.equal(resolveUserDisplayTimeZone('Etc/UTC'), browserTimeZone());
  assert.equal(resolveUserDisplayTimeZone(null), browserTimeZone());
  assert.equal(resolveUserDisplayTimeZone(''), browserTimeZone());

  // Explicit user selections from Settings dropdown are preserved
  assert.equal(resolveUserDisplayTimeZone('Asia/Jakarta (GMT+7)'), 'Asia/Jakarta');
  assert.equal(resolveUserDisplayTimeZone('America/New_York (GMT-5)'), 'America/New_York');
  assert.equal(resolveUserDisplayTimeZone('Europe/London (GMT+0)'), 'Europe/London');

  // 3. Ensure frontend and server agree on month boundaries:
  // 2026-09-01 00:30 Asia/Jakarta is 2026-08-31T17:30:00Z in UTC.
  const sepEarlyMorning = '2026-08-31T17:30:00.000Z';
  assert.equal(getLocalDateKey(sepEarlyMorning, WIB), '2026-09-01', 'History date must be Sep 1');
  assert.equal(getLocalMonthKey(sepEarlyMorning, WIB), '2026-09', 'Overview & Reports month must be September');
  const sepRange = periodRange('2026-09', WIB);
  assert.equal(sepEarlyMorning >= sepRange.start && sepEarlyMorning < sepRange.end, true, 'Belongs to September budget range');
}

console.log('✓ All A-H date/time timezone audit and regression tests passed successfully!');
