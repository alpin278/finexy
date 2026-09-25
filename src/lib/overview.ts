import type { Tables } from '../types/database';
import type { Budget, BudgetPeriod, Wallet, WalletCurrencyCode } from '../types/finance';
import { currentBudgetPeriod, periodLabel, periodRange } from './budget-utils';
import { loadBudgetPage, type BudgetSummaryData } from './budgets';
import { supabase } from './supabase';
import { offlineErrorMessage } from './connectivity';
import { formatWalletAmount, loadWalletsPage } from './wallets';
import { calculateFinancialTotals, isSettledFinancialTransaction } from './financial-analytics';
import { loadUserDisplayPreferences } from './user-display-preferences';
import { groupLogicalActivities } from './transaction-activities';
import { categoryAllocations } from './category-allocations';
import { loadTransactionSplits } from './transaction-splits';

type TransactionRow = Tables<'transactions'>;
type Currency = WalletCurrencyCode;

interface OverviewTransactionRow extends TransactionRow {
  wallet: { id: string; name: string; currency: Currency } | null;
  category: { id: string; name: string; type: 'income' | 'expense' } | null;
  splits?: Array<{ category_id: string; amount: number; category: { id: string; name: string } | null }>;
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
  /** ISO timestamp of when this transaction was recorded in Finexy. */
  createdAt: string;
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
  totalBalanceEstimated: boolean;
  valuationDisclosure: string | null;
  metrics: OverviewMetric[];
  recentTransactions: OverviewRecentTransaction[];
  categorySpending: OverviewCategorySpending[];
  cashFlowTrend: CashFlowPoint[];
  budgetProgress: OverviewBudgetProgress;
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
    for (const allocation of categoryAllocations(row)) {
      const current = totals.get(allocation.categoryId) ?? { label: allocation.label, amount: 0 };
      current.amount += allocation.amount;
      totals.set(allocation.categoryId, current);
    }
  }
  const total = [...totals.values()].reduce((sum, item) => sum + item.amount, 0);
  return [...totals.entries()]
    .map(([id, item], index) => ({ id, ...item, percentage: total > 0 ? (item.amount / total) * 100 : 0, color: spendingColors[index % spendingColors.length] }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);
}

export function buildCashFlowTrend(rows: TransactionRow[], selectedPeriod: BudgetPeriod, currency: Currency): CashFlowPoint[] {
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
    createdAt: row.created_at,
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
    .order('created_at', { ascending: false })
    .order('occurred_at', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  const rows = data as unknown as OverviewTransactionRow[];
  const splits = await loadTransactionSplits(userId, rows.map((row) => row.id));
  return rows.map((row) => ({ ...row, splits: splits.get(row.id) ?? [] }));
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
  const reportingWallets = walletsPage.wallets.filter((wallet) => wallet.status === 'Active');
  const convertibleWallets = reportingWallets.filter((wallet) => wallet.currency === reportingCurrency || wallet.valuation);
  const valuationComplete = convertibleWallets.length === reportingWallets.length;
  const valuationDates = convertibleWallets.flatMap((wallet) => wallet.valuation ? [wallet.valuation] : []);
  const reportingCurrencyTotal = budgetPage.summary.totalsByCurrency.find((total) => total.currency === reportingCurrency) ?? null;

  return {
    period,
    availablePeriods,
    reportingCurrency,
    wallets: walletsPage.wallets,
    totalBalance: valuationComplete ? convertibleWallets.reduce((sum, wallet) => sum + (wallet.currency === reportingCurrency ? wallet.balance : wallet.valuation!.amount), 0) : reportingWallets.filter((wallet) => wallet.currency === reportingCurrency).reduce((sum, wallet) => sum + wallet.balance, 0),
    totalBalanceEstimated: valuationComplete && reportingWallets.some((wallet) => wallet.currency !== reportingCurrency),
    valuationDisclosure: valuationComplete && valuationDates.length ? `Converted using ${valuationDates[0].provider} reference rates dated ${valuationDates[0].rateDate}.` : valuationComplete ? null : 'Estimated total unavailable: one or more wallet currencies have no current reference rate.',
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
  const offline = offlineErrorMessage(error);
  if (offline) return offline;
  if (error instanceof Error && error.message.includes('signed in')) return error.message;
  return 'We could not load your financial overview. Please try again.';
}

export { formatWalletAmount, periodRange };
