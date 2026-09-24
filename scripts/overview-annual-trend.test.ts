import assert from 'node:assert/strict';
import { calculateFinancialTotals } from '../src/lib/financial-analytics.ts';
import { periodRange } from '../src/lib/budget-utils.ts';
import type { BudgetPeriod, WalletCurrencyCode } from '../src/types/finance.ts';
import type { Tables } from '../src/types/database.ts';

// -----------------------------------------------------------------------------
// OVERVIEW ANNUAL TREND UNIT TEST
// Verifies that buildCashFlowTrend logic produces exactly 12 calendar-year buckets
// (Jan through Dec) for the selected period's calendar year without requiring Supabase client.
// -----------------------------------------------------------------------------

type TransactionRow = Tables<'transactions'>;

function calculatePeriodFinancials(rows: TransactionRow[], period: BudgetPeriod, currency: WalletCurrencyCode) {
  return calculateFinancialTotals(rows, periodRange(period), currency);
}

function buildCashFlowTrend(rows: TransactionRow[], selectedPeriod: BudgetPeriod, currency: WalletCurrencyCode) {
  const [yearStr] = selectedPeriod.split('-');
  const year = Number(yearStr);
  return Array.from({ length: 12 }, (_, index) => {
    const monthNumber = String(index + 1).padStart(2, '0');
    const period: BudgetPeriod = `${year}-${monthNumber}`;
    const totals = calculatePeriodFinancials(rows, period, currency);
    return {
      month: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(`${period}-01T00:00:00.000Z`)),
      income: totals.income,
      expenses: totals.expenses,
      net: totals.net,
    };
  });
}

console.log('Testing buildCashFlowTrend calendar-year behavior...');

// Sample transactions across different months of 2026, including a legitimate future-dated transaction
const sampleRows = [
  {
    id: 'tx-jan',
    amount: 1000000,
    currency: 'USD',
    deleted_at: null,
    occurred_at: '2026-01-15T09:00:00.000Z',
    status: 'completed',
    transfer_id: null,
    type: 'income',
  },
  {
    id: 'tx-feb',
    amount: 400000,
    currency: 'USD',
    deleted_at: null,
    occurred_at: '2026-02-10T14:30:00.000Z',
    status: 'completed',
    transfer_id: null,
    type: 'expense',
  },
  {
    id: 'tx-sep',
    amount: 750000,
    currency: 'USD',
    deleted_at: null,
    occurred_at: '2026-09-24T18:00:00.000Z',
    status: 'completed',
    transfer_id: null,
    type: 'expense',
  },
  // Legitimate future-dated transaction in December 2026
  {
    id: 'tx-dec-future',
    amount: 1200000,
    currency: 'USD',
    deleted_at: null,
    occurred_at: '2026-12-25T12:00:00.000Z',
    status: 'completed',
    transfer_id: null,
    type: 'income',
  },
  // Irrelevant transaction from a different year (2025)
  {
    id: 'tx-2025',
    amount: 999999,
    currency: 'USD',
    deleted_at: null,
    occurred_at: '2025-11-01T00:00:00.000Z',
    status: 'completed',
    transfer_id: null,
    type: 'income',
  },
  // Irrelevant currency
  {
    id: 'tx-idr',
    amount: 5000000,
    currency: 'IDR',
    deleted_at: null,
    occurred_at: '2026-06-01T00:00:00.000Z',
    status: 'completed',
    transfer_id: null,
    type: 'income',
  },
  // Pending or deleted transactions should be ignored per settled analytics rule
  {
    id: 'tx-pending',
    amount: 300000,
    currency: 'USD',
    deleted_at: null,
    occurred_at: '2026-03-01T00:00:00.000Z',
    status: 'pending',
    transfer_id: null,
    type: 'income',
  },
  {
    id: 'tx-deleted',
    amount: 500000,
    currency: 'USD',
    deleted_at: '2026-04-02T00:00:00.000Z',
    occurred_at: '2026-04-01T00:00:00.000Z',
    status: 'completed',
    transfer_id: null,
    type: 'income',
  },
];

// Test 1: Selected period = September 2026 ('2026-09')
const trend = buildCashFlowTrend(sampleRows as any, '2026-09', 'USD');

// Assert exactly 12 buckets
assert.equal(trend.length, 12, 'Must always produce exactly 12 buckets');

// Assert months are exactly Jan through Dec in order
const expectedMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
assert.deepEqual(
  trend.map((p) => p.month),
  expectedMonths,
  'Buckets must strictly be Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec'
);

// Assert January: income = 1000000, expenses = 0, net = 1000000
assert.deepEqual(trend[0], { month: 'Jan', income: 1000000, expenses: 0, net: 1000000 });

// Assert February: income = 0, expenses = 400000, net = -400000
assert.deepEqual(trend[1], { month: 'Feb', income: 0, expenses: 400000, net: -400000 });

// Assert March through August (missing months) have all zeros
for (let i = 2; i <= 7; i++) {
  assert.deepEqual(trend[i], {
    month: expectedMonths[i],
    income: 0,
    expenses: 0,
    net: 0,
  }, `Missing month ${expectedMonths[i]} must have zero income, expenses, and net`);
}

// Assert September: income = 0, expenses = 750000, net = -750000
assert.deepEqual(trend[8], { month: 'Sep', income: 0, expenses: 750000, net: -750000 });

// Assert October and November: zeros
assert.deepEqual(trend[9], { month: 'Oct', income: 0, expenses: 0, net: 0 });
assert.deepEqual(trend[10], { month: 'Nov', income: 0, expenses: 0, net: 0 });

// Assert December (future-dated transaction within selected year): income = 1200000, expenses = 0, net = 1200000
assert.deepEqual(trend[11], { month: 'Dec', income: 1200000, expenses: 0, net: 1200000 });

// Test 2: If selected period is another year, e.g. '2025-05', it produces 2025 Jan-Dec
const trend2025 = buildCashFlowTrend(sampleRows as any, '2025-05', 'USD');
assert.equal(trend2025.length, 12);
assert.deepEqual(trend2025.map((p) => p.month), expectedMonths);
// 2025-11 transaction falls into November (index 10)
assert.deepEqual(trend2025[10], { month: 'Nov', income: 999999, expenses: 0, net: 999999 });

console.log('✓ All 12 calendar-year trend assertions passed successfully!');
