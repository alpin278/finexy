import type { PostgrestError } from '@supabase/supabase-js';
import { categoryPresentationMetadata, defaultCategoryRuleSeeds, defaultCategorySeeds } from '../data/categories';
import type { Enums, TablesInsert, TablesUpdate } from '../types/database';
import type { CategoryAccent, CategoryIconName, CategoryRule, CategorySummaryData, FinanceCategory } from '../types/categories';
import type { Budget } from '../types/finance';
import { ensureDefaultCategories, listActiveCategoryRuleRows, type CategoryRow, type CategoryRuleRow } from './category-bootstrap';
import { resolveCategoryIconName } from './category-icons';
import { supabase } from './supabase';

type CategoryType = Enums<'category_type'>;
type CategoryStatus = Enums<'category_status'>;
type CategoryRuleField = Enums<'category_rule_field'>;
type RuleOperator = Enums<'rule_operator'>;

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  icon: CategoryIconName;
  accent: CategoryAccent;
  keywords: string[];
  status: CategoryStatus;
}

export type UpdateCategoryInput = Omit<CreateCategoryInput, 'type'>;

export interface CreateCategoryRuleInput {
  categoryId: string;
  field: CategoryRuleField;
  operator: RuleOperator;
  value: string;
}

export interface CategoryPageData {
  categories: FinanceCategory[];
  rules: CategoryRule[];
  summary: CategorySummaryData;
}

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('You must be signed in to manage categories.');
  }
  return data.user.id;
}

function seedForCategory(row: CategoryRow) {
  return defaultCategorySeeds.find((seed) => seed.name.toLowerCase() === row.name.toLowerCase() && seed.type === row.type);
}

function presentationForCategory(row: CategoryRow) {
  const seed = seedForCategory(row);
  const metadata = seed ? categoryPresentationMetadata[seed.seedId] : undefined;
  return {
    transactionCount: metadata?.transactionCount ?? 0,
    monthlyAverage: metadata?.monthlyAverage ?? 0,
  };
}

function safeAccent(value: string | null): CategoryAccent {
  return ['orange', 'blue', 'green', 'purple', 'yellow', 'red'].includes(value ?? '') ? value as CategoryAccent : 'orange';
}

function mapCategory(row: CategoryRow): FinanceCategory {
  const presentation = presentationForCategory(row);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    icon: resolveCategoryIconName(row.icon_identifier),
    accent: safeAccent(row.accent_identifier),
    ...presentation,
    keywords: row.keywords,
    status: row.status,
  };
}

export function attachCategoryBudgets(categories: FinanceCategory[], budgets: Budget[]) {
  const budgetsByCategory = new Map(budgets.map((budget) => [budget.categoryId, budget]));
  return categories.map((category) => {
    const budget = category.type === 'expense' ? budgetsByCategory.get(category.id) : undefined;
    if (!budget) return category;
    return {
      ...category,
      budgetLimit: budget.monthlyLimit,
      budgetSpent: budget.spent,
      budgetCurrency: budget.currency,
      budgetStatus: budget.status,
      budgetTransactionCount: budget.transactionCount,
      budgetPeriod: budget.period,
    };
  });
}

function ruleMatchCount(row: CategoryRuleRow, categoryRows: CategoryRow[]) {
  const category = categoryRows.find((item) => item.id === row.category_id);
  const seed = category && seedForCategory(category);
  const match = defaultCategoryRuleSeeds.find((item) => item.categorySeedId === seed?.seedId && item.field === row.field && item.operator === row.operator && item.value === row.value);
  return match?.matchCount;
}

function mapRule(row: CategoryRuleRow, categoryRows: CategoryRow[]): CategoryRule {
  const matchCount = ruleMatchCount(row, categoryRows);
  return {
    id: row.id,
    categoryId: row.category_id,
    field: row.field,
    operator: row.operator,
    value: row.value,
    active: row.enabled,
    ...(matchCount === undefined ? {} : { matchCount }),
    ...(row.label ? { label: row.label } : {}),
  };
}

export function buildCategorySummary(categories: FinanceCategory[]): CategorySummaryData {
  const budgetTotalsByCurrency = categories.reduce<CategorySummaryData['budgetTotalsByCurrency']>((totals, category) => {
    if (category.budgetLimit === undefined || !category.budgetCurrency) return totals;
    totals[category.budgetCurrency] = (totals[category.budgetCurrency] ?? 0) + category.budgetLimit;
    return totals;
  }, {});
  return {
    totalCategories: categories.length,
    budgetTotalsByCurrency,
    autoRuleCoverage: null,
    uncategorizedCount: null,
    expenseCategoryCount: categories.filter((category) => category.type === 'expense').length,
    incomeCategoryCount: categories.filter((category) => category.type === 'income').length,
  };
}

export async function loadCategoriesPage(): Promise<CategoryPageData> {
  const userId = await requireUserId();
  const categoryRows = await ensureDefaultCategories(userId);
  const ruleRows = await listActiveCategoryRuleRows(userId);
  const categories = categoryRows.map(mapCategory);
  return {
    categories,
    rules: ruleRows.map((row) => mapRule(row, categoryRows)),
    summary: buildCategorySummary(categories),
  };
}

export async function getCategory(categoryId: string) {
  const userId = await requireUserId();
  const { data, error } = await supabase.from('categories').select('*').eq('id', categoryId).eq('user_id', userId).is('archived_at', null).maybeSingle();
  if (error) throw error;
  return data ? mapCategory(data) : null;
}

export async function createCategory(input: CreateCategoryInput) {
  const userId = await requireUserId();
  const payload: TablesInsert<'categories'> = {
    user_id: userId,
    name: input.name.trim(),
    type: input.type,
    icon_identifier: input.icon,
    accent_identifier: input.accent,
    keywords: input.keywords,
    status: input.status,
  };
  const { data, error } = await supabase.from('categories').insert(payload).select('*').single();
  if (error) throw error;
  return mapCategory(data);
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const userId = await requireUserId();
  const payload: TablesUpdate<'categories'> = {
    name: input.name.trim(),
    icon_identifier: input.icon,
    accent_identifier: input.accent,
    keywords: input.keywords,
    status: input.status,
  };
  const { data, error } = await supabase.from('categories').update(payload).eq('id', categoryId).eq('user_id', userId).is('archived_at', null).select('*').single();
  if (error) throw error;
  return mapCategory(data);
}

export async function archiveCategory(categoryId: string) {
  const userId = await requireUserId();
  const now = new Date().toISOString();
  const { error: rulesError } = await supabase.from('category_rules').update({ deleted_at: now }).eq('category_id', categoryId).eq('user_id', userId).is('deleted_at', null);
  if (rulesError) throw rulesError;
  const { error } = await supabase.from('categories').update({ archived_at: now }).eq('id', categoryId).eq('user_id', userId).is('archived_at', null);
  if (error) throw error;
}

export async function createCategoryRule(input: CreateCategoryRuleInput) {
  const userId = await requireUserId();
  const payload: TablesInsert<'category_rules'> = {
    user_id: userId,
    category_id: input.categoryId,
    field: input.field,
    operator: input.operator,
    value: input.value.trim(),
    enabled: true,
    priority: 0,
    label: 'Custom merchant match',
  };
  const { data, error } = await supabase.from('category_rules').insert(payload).select('*').single();
  if (error) throw error;
  return mapRule(data, []);
}

export async function setCategoryRuleEnabled(ruleId: string, enabled: boolean) {
  const userId = await requireUserId();
  const payload: TablesUpdate<'category_rules'> = { enabled };
  const { data, error } = await supabase.from('category_rules').update(payload).eq('id', ruleId).eq('user_id', userId).is('deleted_at', null).select('*').single();
  if (error) throw error;
  return mapRule(data, []);
}

export async function archiveCategoryRule(ruleId: string) {
  const userId = await requireUserId();
  const { error } = await supabase.from('category_rules').update({ deleted_at: new Date().toISOString() }).eq('id', ruleId).eq('user_id', userId).is('deleted_at', null);
  if (error) throw error;
}

export function categoryErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? (error as PostgrestError).code : undefined;
  if (code === '23505') return 'A category with this name and type already exists.';
  if (code === '23503') return 'This category is still referenced by existing records.';
  if (code === '42501') return 'You do not have permission to change this category.';
  if (error instanceof Error && error.message === 'You must be signed in to manage categories.') return error.message;
  return 'We could not save that category change. Please try again.';
}
