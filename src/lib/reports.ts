import type { Tables } from '../types/database';
import type { WalletCurrencyCode } from '../types/finance';
import { loadBudgetPage } from './budgets';
import { calculateFinancialTotals, isSettledFinancialTransaction, type FinancialDateRange } from './financial-analytics';
import { supabase } from './supabase';
import { loadUserDisplayPreferences } from './user-display-preferences';
import { categoryAllocations } from './category-allocations';
import { loadTransactionSplits } from './transaction-splits';
import { reportBucketForOccurredAt } from './report-buckets';

type TransactionRow = Tables<'transactions'>;
type Currency = WalletCurrencyCode;

interface ReportTransactionRow extends TransactionRow {
  category: { id: string; name: string; icon_identifier: string | null } | null;
  splits?: Array<{ category_id: string; amount: number; category: { id: string; name: string } | null }>;
}

export interface ReportPeriodRange extends FinancialDateRange { label: string; key: string; }
export interface ReportCategory { id: string; label: string; amount: number; percentage: number; color: string; }
export interface ReportTrendPoint { label: string; income: number; expenses: number; net: number; }
export interface ReportBudgetContext { nearLimitCount: number; overBudgetCount: number; utilization: number | null; }
export interface ReportsData {
  reportingCurrency: Currency;
  range: ReportPeriodRange;
  totals: ReturnType<typeof calculateFinancialTotals>;
  incomeCategories: ReportCategory[];
  expenseCategories: ReportCategory[];
  trend: ReportTrendPoint[];
  budgetContext: ReportBudgetContext | null;
}

const colors = ['#FF5A36', '#F29B62', '#E8CF56', '#55B88B', '#7C91B8', '#B6A0C7'];
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function isoDay(date: Date) { return date.toISOString().slice(0, 10); }
function startOfUtcDay(date: Date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); }
function plusDays(date: Date, days: number) { const next = new Date(date); next.setUTCDate(next.getUTCDate() + days); return next; }
function rangeLabel(start: Date, endExclusive: Date) { return `${dateFormatter.format(start)} – ${dateFormatter.format(plusDays(endExclusive, -1))}`; }

export function reportRange(period: 'this-week' | 'this-month' | 'last-month' | 'this-year', now = new Date()): ReportPeriodRange {
  const today = startOfUtcDay(now);
  if (period === 'this-week') {
    const mondayOffset = (today.getUTCDay() + 6) % 7;
    const start = plusDays(today, -mondayOffset); const end = plusDays(start, 7);
    return { start: `${isoDay(start)}T00:00:00.000Z`, end: `${isoDay(end)}T00:00:00.000Z`, label: `This Week (${rangeLabel(start, end)})`, key: 'week' };
  }
  if (period === 'this-year') {
    const start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1)); const end = new Date(Date.UTC(today.getUTCFullYear() + 1, 0, 1));
    return { start: start.toISOString(), end: end.toISOString(), label: `This Year (${today.getUTCFullYear()})`, key: 'year' };
  }
  const monthOffset = period === 'last-month' ? -1 : 0;
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + monthOffset, 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString(), label: `${period === 'last-month' ? 'Last' : 'This'} Month (${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(start)})`, key: 'month' };
}

export function customReportRange(startDay: string, endDay: string): ReportPeriodRange {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDay) || !/^\d{4}-\d{2}-\d{2}$/.test(endDay) || startDay > endDay) throw new Error('End date must be on or after the start date.');
  const start = new Date(`${startDay}T00:00:00.000Z`); const end = plusDays(new Date(`${endDay}T00:00:00.000Z`), 1);
  return { start: start.toISOString(), end: end.toISOString(), label: `Custom Range (${rangeLabel(start, end)})`, key: 'custom' };
}

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in to view reports.');
  return data.user.id;
}

async function loadReportingCurrency(userId: string): Promise<Currency> {
  return (await loadUserDisplayPreferences(userId)).reportingCurrency;
}

function aggregateCategories(rows: ReportTransactionRow[], range: ReportPeriodRange, currency: Currency, type: 'income' | 'expense') {
  const totals = new Map<string, { label: string; amount: number }>();
  for (const row of rows) {
    if (row.type !== type || !isSettledFinancialTransaction(row, range, currency)) continue;
    for (const allocation of categoryAllocations(row)) { const current = totals.get(allocation.categoryId) ?? { label: allocation.label, amount: 0 }; current.amount += allocation.amount; totals.set(allocation.categoryId, current); }
  }
  const total = [...totals.values()].reduce((sum, item) => sum + item.amount, 0);
  return [...totals.entries()].map(([id, item], index) => ({ id, ...item, percentage: total ? (item.amount / total) * 100 : 0, color: colors[index % colors.length] })).sort((a, b) => b.amount - a.amount);
}

function buildTrend(rows: ReportTransactionRow[], range: ReportPeriodRange, currency: Currency): ReportTrendPoint[] {
  const points = new Map<string, ReportTrendPoint>();
  for (const row of rows) {
    if (!isSettledFinancialTransaction(row, range, currency)) continue;
    const bucket = reportBucketForOccurredAt(row.occurred_at, range); const point = points.get(bucket.key) ?? { label: bucket.label, income: 0, expenses: 0, net: 0 };
    if (row.type === 'income') point.income += Number(row.amount); else point.expenses += Number(row.amount);
    point.net = point.income - point.expenses; points.set(bucket.key, point);
  }
  return [...points.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, point]) => point);
}

function calendarMonth(range: ReportPeriodRange) {
  const start = range.start.slice(0, 7); const next = new Date(`${start}-01T00:00:00.000Z`); next.setUTCMonth(next.getUTCMonth() + 1);
  return range.start === `${start}-01T00:00:00.000Z` && range.end === next.toISOString() ? start : null;
}

async function loadBudgetContext(range: ReportPeriodRange, currency: Currency): Promise<ReportBudgetContext | null> {
  const month = calendarMonth(range); if (!month) return null;
  const page = await loadBudgetPage(month);
  const budgets = page.budgets.filter((budget) => budget.currency === currency);
  const limit = budgets.reduce((sum, budget) => sum + budget.monthlyLimit, 0); const spent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  return { nearLimitCount: budgets.filter((budget) => budget.status === 'near_limit').length, overBudgetCount: budgets.filter((budget) => budget.status === 'over_budget').length, utilization: limit > 0 ? (spent / limit) * 100 : null };
}

export async function loadReportsData(range: ReportPeriodRange): Promise<ReportsData> {
  const userId = await requireUserId();
  const [reportingCurrency, transactionResult] = await Promise.all([
    loadReportingCurrency(userId),
    supabase.from('transactions').select('*, category:categories(id, name, icon_identifier)').eq('user_id', userId).is('deleted_at', null).gte('occurred_at', range.start).lt('occurred_at', range.end).order('occurred_at', { ascending: true }),
  ]);
  if (transactionResult.error) throw transactionResult.error;
  const baseRows = transactionResult.data as unknown as ReportTransactionRow[];
  const splits = await loadTransactionSplits(userId, baseRows.map((row) => row.id));
  const rows = baseRows.map((row) => ({ ...row, splits: splits.get(row.id) ?? [] }));
  const totals = calculateFinancialTotals(rows, range, reportingCurrency);
  return { reportingCurrency, range, totals, incomeCategories: aggregateCategories(rows, range, reportingCurrency, 'income'), expenseCategories: aggregateCategories(rows, range, reportingCurrency, 'expense'), trend: buildTrend(rows, range, reportingCurrency), budgetContext: await loadBudgetContext(range, reportingCurrency) };
}

export function reportsErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('signed in')) return error.message;
  return 'We could not load your financial report. Please try again.';
}
