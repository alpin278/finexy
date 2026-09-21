import type { Tables } from '../types/database';
import type { Budget, BudgetPeriod, Wallet, WalletCurrencyCode } from '../types/finance';
import { currentBudgetPeriod, periodLabel, periodRange } from './budget-utils';
import { loadBudgetPage, type BudgetSummaryData } from './budgets';
import { supabase } from './supabase';
import { formatWalletAmount, loadWalletsPage } from './wallets';
import { calculateFinancialTotals, isSettledFinancialTransaction } from './financial-analytics';
import { loadUserDisplayPreferences } from './user-display-preferences';
import { groupLogicalActivities } from './transaction-activities';

type TransactionRow = Tables<'transactions'>;
type Currency = WalletCurrencyCode;

interface OverviewTransactionRow extends TransactionRow {
  wallet: { id: string; name: string; currency: Currency } | null;
  category: { id: string; name: string; type: 'income' | 'expense' } | null;
}

export interface OverviewMetric {
  id: 'income' | 'expenses' | 'net-cash-flow' | 'savings-rate';
  title: string;
  amount: number;
  isPositive: boolean;
  format: 'currency' | 'percentage';
  trendLabel: string;
}

export interface OverviewRecentTransaction {
  id: string;
  reference: string;
  name: string;
  category: string;
  amount: number;
  currency: Currency;
  type: 'income' | 'expense' | 'transfer';
  status: 'completed' | 'pending' | 'canceled';
  occurredAt: string;
  sourceWallet?: string;
  destinationWallet?: string;
  transferId?: string;
}

export interface OverviewCategorySpending {
  id: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface CashFlowPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface OverviewBudgetProgress {
  budgets: Budget[];
  summary: BudgetSummaryData;
  reportingCurrencyTotal: { limit: number; spent: number; remaining: number } | null;
  nearLimitCount: number;
  overBudgetCount: number;
}

export interface OverviewPageData {
  period: BudgetPeriod;
  availablePeriods: BudgetPeriod[];
  reportingCurrency: Currency;
  wallets: Wallet[];
  totalBalance: number;
  metrics: OverviewMetric[];
  recentTransactions: OverviewRecentTransaction[];
  categorySpending: OverviewCategorySpending[];
  cashFlowTrend: CashFlowPoint[];
  budgetProgress: OverviewBudgetProgress;
}

function addMonths(period: BudgetPeriod, offset: number): BudgetPeriod {
  const [year, month] = period.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function rowPeriod(row: TransactionRow) {
  return row.occurred_at.slice(0, 7) as BudgetPeriod;
}

export function calculatePeriodFinancials(rows: TransactionRow[], period: BudgetPeriod, currency: Currency) {
  return calculateFinancialTotals(rows, periodRange(period), currency);
}

const spendingColors = ['#FF5A36', '#F29B62', '#E8CF56', '#55B88B', '#777771'];

export function aggregateCategorySpending(rows: OverviewTransactionRow[], period: BudgetPeriod, currency: Currency): OverviewCategorySpending[] {
  const totals = new Map<string, { label: string; amount: number }>();
  for (const row of rows) {
    if (!isSettledFinancialTransaction(row, periodRange(period), currency) || row.type !== 'expense') continue;
    const id = row.category_id ?? 'uncategorized';
    const current = totals.get(id) ?? { label: row.category?.name ?? 'Uncategorized', amount: 0 };
    current.amount += Number(row.amount);
    totals.set(id, current);
  }
  const total = [...totals.values()].reduce((sum, item) => sum + item.amount, 0);
  return [...totals.entries()]
    .map(([id, item], index) => ({ id, ...item, percentage: total > 0 ? (item.amount / total) * 100 : 0, color: spendingColors[index % spendingColors.length] }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);
}

export function buildCashFlowTrend(rows: TransactionRow[], selectedPeriod: BudgetPeriod, currency: Currency, monthCount = 6): CashFlowPoint[] {
  return Array.from({ length: monthCount }, (_, index) => {
    const period = addMonths(selectedPeriod, index - monthCount + 1);
    const totals = calculatePeriodFinancials(rows, period, currency);
    return { month: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(`${period}-01T00:00:00.000Z`)), income: totals.income, expenses: totals.expenses, net: totals.net };
  });
}

function formatRecentDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(new Date(value));
}

function mapRecentTransaction(row: OverviewTransactionRow, transferRows: OverviewTransactionRow[] = [row]): OverviewRecentTransaction {
  const isTransfer = row.type === 'transfer';
  const sourceWallet = transferRows.find((item) => item.transfer_leg === 'outbound')?.wallet?.name;
  const destinationWallet = transferRows.find((item) => item.transfer_leg === 'inbound')?.wallet?.name;
  return {
    id: row.id,
    reference: row.reference ?? row.id.slice(0, 8).toUpperCase(),
    name: isTransfer ? 'Wallet transfer' : (row.description ?? row.payee ?? 'Untitled transaction'),
    category: isTransfer ? 'Transfer' : (row.category?.name ?? 'Uncategorized'),
    amount: Number(row.amount),
    currency: row.currency as Currency,
    type: row.type,
    status: row.status,
    occurredAt: formatRecentDate(row.occurred_at),
    ...(sourceWallet ? { sourceWallet } : {}),
    ...(destinationWallet ? { destinationWallet } : {}),
    ...(isTransfer && row.transfer_id ? { transferId: row.transfer_id } : {}),
  };
}

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in to view your overview.');
  return data.user.id;
}

async function loadReportingCurrency(userId: string): Promise<Currency> {
  return (await loadUserDisplayPreferences(userId)).reportingCurrency;
}

async function loadOverviewTransactionRows(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, wallet:wallets(id, name, currency), category:categories(id, name, type)')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return data as unknown as OverviewTransactionRow[];
}

export async function loadOverviewPage(period = currentBudgetPeriod()): Promise<OverviewPageData> {
  const userId = await requireUserId();
  const [reportingCurrency, walletsPage, rows, budgetPage] = await Promise.all([
    loadReportingCurrency(userId),
    loadWalletsPage(),
    loadOverviewTransactionRows(userId),
    loadBudgetPage(period),
  ]);
  const transactionPeriods = rows.map(rowPeriod);
  const availablePeriods = [...new Set([currentBudgetPeriod(), period, ...transactionPeriods, ...budgetPage.availablePeriods])].sort((a, b) => b.localeCompare(a));
  const totals = calculatePeriodFinancials(rows, period, reportingCurrency);
  const reportingWallets = walletsPage.wallets.filter((wallet) => wallet.currency === reportingCurrency && wallet.status === 'Active');
  const reportingCurrencyTotal = budgetPage.summary.totalsByCurrency.find((total) => total.currency === reportingCurrency) ?? null;

  return {
    period,
    availablePeriods,
    reportingCurrency,
    wallets: walletsPage.wallets,
    totalBalance: reportingWallets.reduce((sum, wallet) => sum + wallet.balance, 0),
    metrics: [
      { id: 'income', title: 'Income', amount: totals.income, isPositive: true, format: 'currency', trendLabel: periodLabel(period) },
      { id: 'expenses', title: 'Expenses', amount: totals.expenses, isPositive: false, format: 'currency', trendLabel: periodLabel(period) },
      { id: 'net-cash-flow', title: 'Net Cash Flow', amount: totals.net, isPositive: totals.net >= 0, format: 'currency', trendLabel: periodLabel(period) },
      { id: 'savings-rate', title: 'Savings Rate', amount: totals.savingsRate, isPositive: totals.savingsRate >= 0, format: 'percentage', trendLabel: totals.income > 0 ? periodLabel(period) : 'No income recorded' },
    ],
    recentTransactions: groupLogicalActivities(rows.map((row) => ({ ...row, transferId: row.transfer_id ?? undefined, transferLeg: row.transfer_leg ?? undefined })))
      .slice(0, 6)
      .map(({ primary, items }) => mapRecentTransaction(primary, items)),
    categorySpending: aggregateCategorySpending(rows, period, reportingCurrency),
    cashFlowTrend: buildCashFlowTrend(rows, period, reportingCurrency),
    budgetProgress: {
      budgets: budgetPage.budgets,
      summary: budgetPage.summary,
      reportingCurrencyTotal: reportingCurrencyTotal ? { limit: reportingCurrencyTotal.limit, spent: reportingCurrencyTotal.spent, remaining: reportingCurrencyTotal.remaining } : null,
      nearLimitCount: budgetPage.budgets.filter((budget) => budget.status === 'near_limit').length,
      overBudgetCount: budgetPage.summary.overBudgetCategoryCount,
    },
  };
}

export function overviewErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('signed in')) return error.message;
  return 'We could not load your financial overview. Please try again.';
}

export { formatWalletAmount, periodRange };
