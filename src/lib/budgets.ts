import type { PostgrestError } from '@supabase/supabase-js';
import { defaultBudgetSeeds, demoBudgetPeriod } from '../data/budgets';
import { defaultCategorySeeds } from '../data/categories';
import type { Enums, Tables, TablesInsert, TablesUpdate } from '../types/database';
import type { Budget, BudgetCategoryOption, BudgetCurrencyTotal, BudgetPeriod, WalletCurrencyCode } from '../types/finance';
import { ensureDefaultCategories } from './category-bootstrap';
import { getBudgetStatus, currentBudgetPeriod, isBudgetPeriod, periodRange, periodStartDate } from './budget-utils';
import { resolveCategoryIconName } from './category-icons';
import { supabase } from './supabase';
import { loadUserDisplayPreferences, type UserDisplayPreferences } from './user-display-preferences';
import { categoryAllocations } from './category-allocations';
import { loadTransactionSplits } from './transaction-splits';

type BudgetRow = Tables<'budgets'>;
type BudgetCurrency = Enums<'currency_code'>;

interface JoinedBudgetRow extends BudgetRow {
  category: { id: string; name: string; type: 'income' | 'expense'; icon_identifier: string | null } | null;
}

interface BudgetSpendRow {
  id: string;
  category_id: string | null;
  amount: number;
  currency: BudgetCurrency;
  occurred_at: string;
  type: Enums<'transaction_type'>;
  status: Enums<'transaction_status'>;
  transfer_id: string | null;
  deleted_at: string | null;
  splits?: Array<{ category_id: string; amount: number; category: { name: string } | null }>;
}

export interface CreateBudgetInput {
  categoryId: string;
  period: BudgetPeriod;
  limitAmount: number;
  currency: WalletCurrencyCode;
  notes?: string | null;
}

export interface UpdateBudgetInput {
  period?: BudgetPeriod;
  limitAmount?: number;
  currency?: WalletCurrencyCode;
  notes?: string | null;
}

export interface BudgetSummaryData {
  activeBudgetCount: number;
  totalsByCurrency: BudgetCurrencyTotal[];
  overBudgetCategoryCount: number;
}

export interface CategoryBudgetLayer {
  period: BudgetPeriod;
  budgets: Budget[];
  byCategory: Record<string, Budget>;
}

export interface BudgetPageData extends CategoryBudgetLayer {
  availablePeriods: BudgetPeriod[];
  categories: BudgetCategoryOption[];
  summary: BudgetSummaryData;
  displayPreferences: UserDisplayPreferences;
}

function isDuplicateError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === '23505');
}

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in to manage budgets.');
  return data.user.id;
}

function validatePeriod(period: string): asserts period is BudgetPeriod {
  if (!isBudgetPeriod(period)) throw new Error('Choose a valid monthly budget period.');
}

function validateLimit(limitAmount: number) {
  if (!Number.isFinite(limitAmount) || limitAmount <= 0) throw new Error('Enter a budget limit greater than 0.');
}

function validateCurrency(currency: string): asserts currency is WalletCurrencyCode {
  if (!['USD', 'EUR', 'GBP', 'IDR'].includes(currency)) throw new Error('Choose a supported budget currency.');
}

function validateNotes(notes: string | null | undefined) {
  if (notes && notes.trim().length > 500) throw new Error('Budget notes must be 500 characters or fewer.');
}

async function listRawBudgetRows(userId: string, period?: BudgetPeriod) {
  let query = supabase
    .from('budgets')
    .select('*, category:categories(id, name, type, icon_identifier)')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('period_start', { ascending: false })
    .order('created_at', { ascending: true });
  if (period) query = query.eq('period_start', periodStartDate(period));
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as JoinedBudgetRow[];
}

async function listBudgetableTransactions(userId: string, period: BudgetPeriod) {
  const range = periodRange(period);
  const { data, error } = await supabase
    .from('transactions')
    .select('id, category_id, amount, currency, occurred_at, type, status, transfer_id, deleted_at')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .eq('status', 'completed')
    .is('deleted_at', null)
    .is('transfer_id', null)
    .gte('occurred_at', range.start)
    .lt('occurred_at', range.end);
  if (error) throw error;
  const rows = data as unknown as BudgetSpendRow[];
  const splits = await loadTransactionSplits(userId, rows.map((row) => row.id));
  return rows.map((row) => ({ ...row, splits: splits.get(row.id) ?? [] }));
}

function usageForRow(row: JoinedBudgetRow, transactions: BudgetSpendRow[]) {
  const matches = transactions.flatMap((transaction) => categoryAllocations(transaction).map((allocation) => ({ ...transaction, category_id: allocation.categoryId, amount: allocation.amount }))).filter((transaction) => (
    transaction.category_id === row.category_id
    && transaction.currency === row.currency
    && transaction.type === 'expense'
    && transaction.status === 'completed'
    && transaction.deleted_at === null
    && transaction.transfer_id === null
  ));
  return {
    spent: matches.reduce((total, transaction) => total + Number(transaction.amount), 0),
    transactionCount: matches.length,
  };
}

function mapBudget(row: JoinedBudgetRow, transactions: BudgetSpendRow[]): Budget {
  const usage = usageForRow(row, transactions);
  const limit = Number(row.limit_amount);
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? 'Unknown category',
    monthlyLimit: limit,
    currency: row.currency,
    spent: usage.spent,
    transactionCount: usage.transactionCount,
    period: row.period_start.slice(0, 7),
    status: getBudgetStatus(usage.spent, limit),
    icon: resolveCategoryIconName(row.category?.icon_identifier),
    ...(row.notes ? { notes: row.notes } : {}),
  };
}

function buildSummary(budgets: Budget[]): BudgetSummaryData {
  const totals = new Map<WalletCurrencyCode, BudgetCurrencyTotal>();
  for (const budget of budgets) {
    const current = totals.get(budget.currency) ?? { currency: budget.currency, limit: 0, spent: 0, remaining: 0 };
    current.limit += budget.monthlyLimit;
    current.spent += budget.spent;
    current.remaining += budget.monthlyLimit - budget.spent;
    totals.set(budget.currency, current);
  }
  return {
    activeBudgetCount: budgets.length,
    totalsByCurrency: [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
    overBudgetCategoryCount: budgets.filter((budget) => budget.status === 'over_budget').length,
  };
}

function availablePeriods(rows: BudgetRow[]) {
  const periods = new Set(rows.map((row) => row.period_start.slice(0, 7)));
  periods.add(currentBudgetPeriod());
  return [...periods].sort((a, b) => b.localeCompare(a));
}

function preferredPeriod(rows: BudgetRow[]) {
  const current = currentBudgetPeriod();
  const rowPeriods = rows.map((row) => row.period_start.slice(0, 7));
  if (rowPeriods.includes(current)) return current;
  if (rowPeriods.includes(demoBudgetPeriod)) return demoBudgetPeriod;
  return rowPeriods.sort((a, b) => b.localeCompare(a))[0] ?? current;
}

async function deterministicBudgetId(userId: string, categorySeedId: string) {
  const input = `${userId}:budget:${categorySeedId}:${demoBudgetPeriod}`;
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)));
  const hex = Array.from(bytes.slice(0, 16), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(8 | (Number.parseInt(hex[16], 16) & 3)).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`;
}

async function bootstrapDefaultBudgets(userId: string, categoryRows: Tables<'categories'>[], rows: JoinedBudgetRow[]) {
  if (rows.some((row) => row.period_start.slice(0, 7) === demoBudgetPeriod)) return rows;

  const categoryBySeed = new Map(categoryRows.flatMap((row) => {
    const seed = defaultCategorySeeds.find((item) => item.name.toLowerCase() === row.name.toLowerCase() && item.type === 'expense');
    return seed ? [[seed.seedId, row] as const] : [];
  }));

  for (const seed of defaultBudgetSeeds) {
    const category = categoryBySeed.get(seed.categorySeedId);
    if (!category) continue;
    const payload: TablesInsert<'budgets'> = {
      id: await deterministicBudgetId(userId, seed.categorySeedId),
      user_id: userId,
      category_id: category.id,
      period_type: 'monthly',
      period_start: periodStartDate(demoBudgetPeriod),
      limit_amount: seed.limitAmount,
      currency: seed.currency,
      notes: null,
    };
    const { error } = await supabase.from('budgets').upsert(payload, { onConflict: 'id', ignoreDuplicates: true });
    if (error && !isDuplicateError(error)) throw error;
  }
  return listRawBudgetRows(userId);
}

async function preparedBudgetRows(userId: string) {
  const categoryRows = await ensureDefaultCategories(userId);
  const rows = await listRawBudgetRows(userId);
  const bootstrapped = await bootstrapDefaultBudgets(userId, categoryRows, rows);
  return { categoryRows, rows: bootstrapped };
}

async function mapRowsForPeriod(userId: string, rows: JoinedBudgetRow[], period: BudgetPeriod) {
  const periodRows = rows.filter((row) => row.period_start.slice(0, 7) === period);
  const transactions = await listBudgetableTransactions(userId, period);
  return periodRows.map((row) => mapBudget(row, transactions));
}

export async function listBudgets(period?: BudgetPeriod) {
  const userId = await requireUserId();
  if (period) validatePeriod(period);
  const rows = await listRawBudgetRows(userId, period);
  return mapRowsForPeriod(userId, rows, period ?? preferredPeriod(rows));
}

export async function listBudgetPeriods() {
  const userId = await requireUserId();
  const { rows } = await preparedBudgetRows(userId);
  return availablePeriods(rows);
}

export async function loadBudgetPage(period?: BudgetPeriod): Promise<BudgetPageData> {
  const userId = await requireUserId();
  if (period) validatePeriod(period);
  const [{ categoryRows, rows }, displayPreferences] = await Promise.all([
    preparedBudgetRows(userId),
    loadUserDisplayPreferences(userId),
  ]);
  const selectedPeriod = period ?? preferredPeriod(rows);
  const budgets = await mapRowsForPeriod(userId, rows, selectedPeriod);
  const categories: BudgetCategoryOption[] = categoryRows
    .filter((category) => category.type === 'expense' && category.status === 'active')
    .map((category) => ({ id: category.id, name: category.name, icon: resolveCategoryIconName(category.icon_identifier) }));
  return {
    period: selectedPeriod,
    budgets,
    byCategory: Object.fromEntries(budgets.map((budget) => [budget.categoryId, budget])),
    availablePeriods: availablePeriods(rows),
    categories,
    summary: buildSummary(budgets),
    displayPreferences,
  };
}

export async function loadCategoryBudgetLayer(period?: BudgetPeriod): Promise<CategoryBudgetLayer> {
  const userId = await requireUserId();
  if (period) validatePeriod(period);
  const { rows } = await preparedBudgetRows(userId);
  const selectedPeriod = period ?? preferredPeriod(rows);
  const budgets = await mapRowsForPeriod(userId, rows, selectedPeriod);
  return {
    period: selectedPeriod,
    budgets,
    byCategory: Object.fromEntries(budgets.map((budget) => [budget.categoryId, budget])),
  };
}

export async function getBudget(budgetId: string) {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(id, name, type, icon_identifier)')
    .eq('id', budgetId)
    .eq('user_id', userId)
    .is('archived_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as JoinedBudgetRow;
  return (await mapRowsForPeriod(userId, [row], row.period_start.slice(0, 7)))[0] ?? null;
}

async function validateBudgetCategory(userId: string, categoryId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, type, status, archived_at')
    .eq('id', categoryId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.archived_at || data.status !== 'active') throw new Error('Choose an active expense category owned by you.');
  if (data.type !== 'expense') throw new Error('Budgets can only be assigned to expense categories.');
}

export async function createBudget(input: CreateBudgetInput) {
  const userId = await requireUserId();
  validatePeriod(input.period);
  validateLimit(input.limitAmount);
  validateCurrency(input.currency);
  validateNotes(input.notes);
  await validateBudgetCategory(userId, input.categoryId);
  const payload: TablesInsert<'budgets'> = {
    user_id: userId,
    category_id: input.categoryId,
    period_type: 'monthly',
    period_start: periodStartDate(input.period),
    limit_amount: input.limitAmount,
    currency: input.currency,
    notes: input.notes?.trim() || null,
  };
  const { data, error } = await supabase.from('budgets').insert(payload).select('id').single();
  if (error) throw error;
  return getBudget(data.id);
}

export async function updateBudget(budgetId: string, input: UpdateBudgetInput) {
  const userId = await requireUserId();
  if (input.period) validatePeriod(input.period);
  if (input.limitAmount !== undefined) validateLimit(input.limitAmount);
  if (input.currency) validateCurrency(input.currency);
  validateNotes(input.notes);
  const payload: TablesUpdate<'budgets'> = {
    ...(input.period === undefined ? {} : { period_start: periodStartDate(input.period) }),
    ...(input.limitAmount === undefined ? {} : { limit_amount: input.limitAmount }),
    ...(input.currency === undefined ? {} : { currency: input.currency }),
    ...(input.notes === undefined ? {} : { notes: input.notes?.trim() || null }),
  };
  const { data, error } = await supabase
    .from('budgets')
    .update(payload)
    .eq('id', budgetId)
    .eq('user_id', userId)
    .is('archived_at', null)
    .select('id')
    .single();
  if (error) throw error;
  return getBudget(data.id);
}

export async function archiveBudget(budgetId: string) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('budgets')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', budgetId)
    .eq('user_id', userId)
    .is('archived_at', null);
  if (error) throw error;
}

export const deleteBudget = archiveBudget;

export function budgetErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? (error as PostgrestError).code : undefined;
  if (code === '23505') return 'This category already has a budget for that period.';
  if (code === '23503') return 'Choose an expense category owned by your account.';
  if (code === '23514') return 'Check the budget period, currency, notes, and limit.';
  if (code === '42501') return 'You do not have permission to change this budget.';
  if (error instanceof Error && error.message.includes('Budgets can only')) return error.message;
  if (error instanceof Error && error.message.includes('expense category')) return error.message;
  if (error instanceof Error && error.message.includes('budget')) return error.message;
  if (error instanceof Error && error.message === 'You must be signed in to manage budgets.') return error.message;
  return 'We could not save that budget change. Please try again.';
}
