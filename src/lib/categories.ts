import type { PostgrestError } from '@supabase/supabase-js';
import { mockBudgets } from '../data/budgets';
import { categoryPresentationMetadata, defaultCategoryRuleSeeds, defaultCategorySeeds } from '../data/categories';
import type { Enums, Tables, TablesInsert, TablesUpdate } from '../types/database';
import type { CategoryAccent, CategoryIconName, CategoryRule, CategorySummaryData, FinanceCategory } from '../types/categories';
import { supabase } from './supabase';

type CategoryRow = Tables<'categories'>;
type CategoryRuleRow = Tables<'category_rules'>;
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

function isDuplicateError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === '23505');
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
  const bridgeBudget = mockBudgets.find((budget) => budget.categoryName.toLowerCase() === row.name.toLowerCase() && row.type === 'expense');
  return {
    transactionCount: metadata?.transactionCount ?? 0,
    monthlyAverage: metadata?.monthlyAverage ?? 0,
    ...(bridgeBudget ? { budgetLimit: bridgeBudget.monthlyLimit, spent: bridgeBudget.spent } : {}),
  };
}

function safeIcon(value: string | null): CategoryIconName {
  return defaultCategorySeeds.some((seed) => seed.icon === value) ? value as CategoryIconName : 'wallet';
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
    icon: safeIcon(row.icon_identifier),
    accent: safeAccent(row.accent_identifier),
    ...presentation,
    keywords: row.keywords,
    status: row.status,
  };
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

function budgetCap(categories: FinanceCategory[]) {
  const cap = categories.reduce((sum, category) => sum + (category.budgetLimit ?? 0), 0);
  return cap > 0 ? cap : null;
}

export function buildCategorySummary(categories: FinanceCategory[]): CategorySummaryData {
  return {
    totalCategories: categories.length,
    monthlyBudgetCap: budgetCap(categories),
    autoRuleCoverage: null,
    uncategorizedCount: null,
    expenseCategoryCount: categories.filter((category) => category.type === 'expense').length,
    incomeCategoryCount: categories.filter((category) => category.type === 'income').length,
  };
}

async function listCategoryRows(userId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function listRuleRows(userId: string) {
  const { data, error } = await supabase
    .from('category_rules')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function insertDefaultCategory(userId: string, seed: (typeof defaultCategorySeeds)[number]) {
  const payload: TablesInsert<'categories'> = {
    user_id: userId,
    name: seed.name,
    type: seed.type,
    icon_identifier: seed.icon,
    accent_identifier: seed.accent,
    keywords: seed.keywords,
    status: seed.status,
  };
  const { error } = await supabase.from('categories').insert(payload);
  if (error && !isDuplicateError(error)) throw error;
}

async function defaultRuleId(userId: string, seed: (typeof defaultCategoryRuleSeeds)[number]) {
  const input = `${userId}:${seed.categorySeedId}:${seed.field}:${seed.operator}:${seed.value}`;
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)));
  const hex = Array.from(bytes.slice(0, 16), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(8 | (Number.parseInt(hex[16], 16) & 3)).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`;
}

async function bootstrapDefaults(userId: string, categoryRows: CategoryRow[]) {
  if (categoryRows.length > 0) return categoryRows;

  for (const seed of defaultCategorySeeds) {
    await insertDefaultCategory(userId, seed);
  }

  const bootstrappedRows = await listCategoryRows(userId);
  const categoryIdBySeed = new Map(bootstrappedRows.flatMap((row) => {
    const seed = seedForCategory(row);
    return seed ? [[seed.seedId, row.id] as const] : [];
  }));
  const existingRules = await listRuleRows(userId);

  for (const seed of defaultCategoryRuleSeeds) {
    const categoryId = categoryIdBySeed.get(seed.categorySeedId);
    if (!categoryId) continue;
    const alreadyExists = existingRules.some((rule) => rule.category_id === categoryId && rule.field === seed.field && rule.operator === seed.operator && rule.value === seed.value);
    if (alreadyExists) continue;
    const payload: TablesInsert<'category_rules'> = {
      id: await defaultRuleId(userId, seed),
      user_id: userId,
      category_id: categoryId,
      field: seed.field,
      operator: seed.operator,
      value: seed.value,
      label: seed.label,
      enabled: true,
      priority: 0,
    };
    const { error } = await supabase.from('category_rules').upsert(payload, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  }

  return bootstrappedRows;
}

export async function loadCategoriesPage(): Promise<CategoryPageData> {
  const userId = await requireUserId();
  let categoryRows = await listCategoryRows(userId);
  categoryRows = await bootstrapDefaults(userId, categoryRows);
  const ruleRows = await listRuleRows(userId);
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
