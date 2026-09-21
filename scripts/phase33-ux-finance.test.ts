import assert from 'node:assert/strict';
import { positiveChartDomain, signedChartDomain } from '../src/lib/chart-scale.ts';
import { reportBucketForOccurredAt } from '../src/lib/report-buckets.ts';
import { calculateFinancialTotals } from '../src/lib/financial-analytics.ts';
import { groupLogicalActivities } from '../src/lib/transaction-activities.ts';

assert.deepEqual(positiveChartDomain([700000, 400000]), [0, 1000000]);
assert.deepEqual(positiveChartDomain([4000000]), [0, 5000000]);
assert.deepEqual(signedChartDomain([2000000, 1768000, 232000, -450000]), [-5000000, 5000000]);
const longRange = { start: '2026-01-01T00:00:00.000Z', end: '2026-07-01T00:00:00.000Z' };
assert.equal(reportBucketForOccurredAt('2026-03-12T12:00:00Z', longRange).key, '2026-03-01');
const foreign = { id: 'usd', type: 'expense' as const, currency: 'USD', amount: 50, status: 'completed' as const, deleted_at: null, occurred_at: '2026-09-22T00:00:00Z' };
assert.equal(groupLogicalActivities([foreign]).length, 1, 'history retains native foreign-currency activity');
assert.equal(calculateFinancialTotals([foreign], { start: '2026-09-01T00:00:00Z', end: '2026-10-01T00:00:00Z' }, 'IDR').expenses, 0, 'IDR KPIs exclude USD history without historical FX');
console.log('phase33 UX finance, chart scale, buckets, and currency semantics passed');
