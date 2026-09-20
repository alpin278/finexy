import { defaultCategoryRuleSeeds, defaultCategorySeeds } from '../data/categories';
import type { Tables, TablesInsert } from '../types/database';
import { supabase } from './supabase';

export type CategoryRow = Tables<'categories'>;
export type CategoryRuleRow = Tables<'category_rules'>;

function isDuplicateError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === '23505');
}

export async function listActiveCategoryRows(userId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function listActiveRuleRows(userId: string) {
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

async function bootstrapDefaultRules(userId: string, categoryRows: CategoryRow[]) {
  const categoryIdBySeed = new Map(categoryRows.flatMap((row) => {
    const seed = defaultCategorySeeds.find((item) => item.name.toLowerCase() === row.name.toLowerCase() && item.type === row.type);
    return seed ? [[seed.seedId, row.id] as const] : [];
  }));
  const existingRules = await listActiveRuleRows(userId);

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
    if (error && !isDuplicateError(error)) throw error;
  }
}

/** Ensure the deterministic category/rule foundation exists for first-load flows. */
export async function ensureDefaultCategories(userId: string) {
  let rows = await listActiveCategoryRows(userId);
  if (rows.length === 0) {
    for (const seed of defaultCategorySeeds) await insertDefaultCategory(userId, seed);
    rows = await listActiveCategoryRows(userId);
  }
  await bootstrapDefaultRules(userId, rows);
  return rows;
}

export async function listActiveCategoryRuleRows(userId: string) {
  return listActiveRuleRows(userId);
}
