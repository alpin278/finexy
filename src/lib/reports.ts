import type { Tables } from '../types/database';
import type { WalletCurrencyCode } from '../types/finance';
import { loadBudgetPage } from './budgets';
import { calculateFinancialTotals, isSettledFinancialTransaction } from './financial-analytics';
import { supabase } from './supabase';
import { offlineErrorMessage } from './connectivity';
import { loadUserDisplayPreferences } from './user-display-preferences';
import { categoryAllocations } from './category-allocations';
import { loadTransactionSplits } from './transaction-splits';
import { reportBucketForOccurredAt } from './report-buckets';
import { getLocalCalendarParts, getLocalMonthKey, reportRange, customReportRange, type ReportPeriodRange, zonedDateTimeToIso } from './date-time';

type TransactionRow = Tables<'transactions'>;
type Currency = WalletCurrencyCode;

interface ReportTransactionRow extends TransactionRow {
  category: { id: string; name: string; icon_identifier: string | null } | null;
  splits?: Array<{ category_id: string; amount: number; category: { id: string; name: string } | null }>;
}

export { reportRange, customReportRange, type ReportPeriodRange };
export interface ReportCategory { id: string; label: string; amount: number; percentage: number; color: string; }
export interface ReportTrendPoint { label: string; income: number; expenses: number; net: number; }
export interface ReportBudgetContext { nearLimitCount: number; overBudgetCount: number; utilization: number | null; }
export interface ReportsData {
  reportingCurrency: Currency;
  timeZone: string;
  range: ReportPeriodRange;
  totals: ReturnType<typeof calculateFinancialTotals>;
  incomeCategories: ReportCategory[];
  expenseCategories: ReportCategory[];
  trend: ReportTrendPoint[];
  budgetContext: ReportBudgetContext | null;
}

const colors = ['#FF5A36', '#F29B62', '#E8CF56', '#55B88B', '#7C91B8', '#B6A0C7'];
function isoDay(date: Date) { return date.toISOString().slice(0, 10); }

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in to view reports.');
  return data.user.id;
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

function buildTrend(rows: ReportTransactionRow[], range: ReportPeriodRange, currency: Currency, timeZone: string): ReportTrendPoint[] {
  const points = new Map<string, ReportTrendPoint>();
  if (range.key === 'year') {
    const year = getLocalCalendarParts(range.start, timeZone).year;
    for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
      const monthDate = new Date(Date.UTC(year, monthIdx, 1));
      const bucket = reportBucketForOccurredAt(zonedDateTimeToIso(isoDay(monthDate), '00:00:00', timeZone), range, timeZone);
      points.set(bucket.key, { label: bucket.label, income: 0, expenses: 0, net: 0 });
    }
  }
  for (const row of rows) {
    if (!isSettledFinancialTransaction(row, range, currency)) continue;
    const bucket = reportBucketForOccurredAt(row.occurred_at, range, timeZone); const point = points.get(bucket.key) ?? { label: bucket.label, income: 0, expenses: 0, net: 0 };
    if (row.type === 'income') point.income += Number(row.amount); else point.expenses += Number(row.amount);
    point.net = point.income - point.expenses; points.set(bucket.key, point);
  }
  return [...points.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, point]) => point);
}

function calendarMonth(range: ReportPeriodRange, timeZone: string) {
  return range.key === 'month' ? getLocalMonthKey(range.start, timeZone) : null;
}

async function loadBudgetContext(range: ReportPeriodRange, currency: Currency, timeZone: string): Promise<ReportBudgetContext | null> {
  const month = calendarMonth(range, timeZone); if (!month) return null;
  const page = await loadBudgetPage(month);
  const budgets = page.budgets.filter((budget) => budget.currency === currency);
  const limit = budgets.reduce((sum, budget) => sum + budget.monthlyLimit, 0); const spent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  return { nearLimitCount: budgets.filter((budget) => budget.status === 'near_limit').length, overBudgetCount: budgets.filter((budget) => budget.status === 'over_budget').length, utilization: limit > 0 ? (spent / limit) * 100 : null };
}

export async function loadReportsData(range: ReportPeriodRange): Promise<ReportsData> {
  const userId = await requireUserId();
  const [displayPreferences, transactionResult] = await Promise.all([
    loadUserDisplayPreferences(userId),
    supabase.from('transactions').select('*, category:categories(id, name, icon_identifier)').eq('user_id', userId).is('deleted_at', null).gte('occurred_at', range.start).lt('occurred_at', range.end).order('occurred_at', { ascending: true }),
  ]);
  if (transactionResult.error) throw transactionResult.error;
  const baseRows = transactionResult.data as unknown as ReportTransactionRow[];
  const splits = await loadTransactionSplits(userId, baseRows.map((row) => row.id));
  const rows = baseRows.map((row) => ({ ...row, splits: splits.get(row.id) ?? [] }));
  const totals = calculateFinancialTotals(rows, range, displayPreferences.reportingCurrency);
  return { reportingCurrency: displayPreferences.reportingCurrency, timeZone: displayPreferences.timeZone, range, totals, incomeCategories: aggregateCategories(rows, range, displayPreferences.reportingCurrency, 'income'), expenseCategories: aggregateCategories(rows, range, displayPreferences.reportingCurrency, 'expense'), trend: buildTrend(rows, range, displayPreferences.reportingCurrency, displayPreferences.timeZone), budgetContext: await loadBudgetContext(range, displayPreferences.reportingCurrency, displayPreferences.timeZone) };
}

export function reportsErrorMessage(error: unknown) {
  const offline = offlineErrorMessage(error);
  if (offline) return offline;
  if (error instanceof Error && error.message.includes('signed in')) return error.message;
  return 'We could not load your financial report. Please try again.';
}
