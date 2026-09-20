import { supabase } from './supabase';

export type RecurringRule = { id: string; type: 'income' | 'expense'; wallet_id: string; category_id: string; amount: number; note: string | null; frequency: 'weekly' | 'monthly'; start_date: string; end_date: string | null; next_due_at: string; local_time: string; active: boolean; archived_at: string | null; wallet: { name: string; currency: string } | null; category: { name: string } | null; };
export type RecurringRuleInput = { type: 'income' | 'expense'; walletId: string; categoryId: string; amount: number; note: string; frequency: 'weekly' | 'monthly'; startDate: string; endDate: string; localTime: string; };

export async function loadRecurringRules(): Promise<RecurringRule[]> { const { data, error } = await (supabase as any).from('recurring_transaction_rules').select('*, wallet:wallets(name,currency), category:categories(name)').is('archived_at', null).order('next_due_at'); if (error) throw error; return data ?? []; }
export async function createRecurringRule(value: RecurringRuleInput) { const { error } = await (supabase as any).rpc('create_recurring_transaction_rule', { p_type: value.type, p_wallet_id: value.walletId, p_category_id: value.categoryId, p_amount: value.amount, p_note: value.note, p_frequency: value.frequency, p_start_date: value.startDate, p_end_date: value.endDate || null, p_local_time: value.localTime }); if (error) throw error; }
export async function setRecurringRuleActive(id: string, active: boolean) { const { error } = await (supabase as any).rpc('set_recurring_transaction_rule_active', { p_rule_id: id, p_active: active }); if (error) throw error; }
export async function archiveRecurringRule(id: string) { const { error } = await (supabase as any).rpc('archive_recurring_transaction_rule', { p_rule_id: id }); if (error) throw error; }

export async function updateRecurringRule(id: string, value: RecurringRuleInput) { const { error } = await (supabase as any).rpc('update_recurring_transaction_rule', { p_rule_id: id, p_type: value.type, p_wallet_id: value.walletId, p_category_id: value.categoryId, p_amount: value.amount, p_note: value.note, p_frequency: value.frequency, p_start_date: value.startDate, p_end_date: value.endDate || null, p_local_time: value.localTime }); if (error) throw error; }

