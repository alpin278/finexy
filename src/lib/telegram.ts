import { supabase } from './supabase';

export type TelegramConnection =
  | { status: 'not_connected' }
  | { status: 'link_code_ready'; code: string; expiresAt: string }
  | { status: 'connected'; linkedAt: string | null };

export type TelegramBudgetNotificationPreferences = { nearLimit: boolean; overLimit: boolean };
const preferenceKeys = ['budget_near_limit', 'budget_over_limit'] as const;

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in to manage Telegram preferences.');
  return data.user.id;
}

export async function loadTelegramConnection(): Promise<TelegramConnection> {
  const { data, error } = await supabase.from('user_integrations').select('linked_at').eq('provider', 'telegram').eq('status', 'active').is('deleted_at', null).maybeSingle();
  if (error) throw error;
  return data ? { status: 'connected', linkedAt: data.linked_at } : { status: 'not_connected' };
}

export async function loadTelegramBudgetNotificationPreferences(connected: boolean): Promise<TelegramBudgetNotificationPreferences> {
  if (!connected) return { nearLimit: false, overLimit: false };
  const userId = await requireUserId();
  const { data, error } = await supabase.from('notification_preferences').select('preference_key, enabled').eq('user_id', userId).eq('channel', 'telegram').in('preference_key', preferenceKeys);
  if (error) throw error;
  const existing = new Map((data ?? []).map((item) => [item.preference_key, item.enabled]));
  const missing = preferenceKeys.filter((key) => !existing.has(key));
  if (missing.length) {
    const { error: insertError } = await supabase.from('notification_preferences').upsert(missing.map((preference_key) => ({ user_id: userId, preference_key, channel: 'telegram', enabled: false })), { onConflict: 'user_id,preference_key,channel', ignoreDuplicates: true });
    if (insertError) throw insertError;
  }
  return { nearLimit: existing.get('budget_near_limit') ?? false, overLimit: existing.get('budget_over_limit') ?? false };
}

export async function saveTelegramBudgetNotificationPreferences(value: TelegramBudgetNotificationPreferences) {
  const userId = await requireUserId();
  if ((await loadTelegramConnection()).status !== 'connected') throw new Error('Telegram must be connected before enabling Telegram notifications.');
  const { error } = await supabase.from('notification_preferences').upsert([{ user_id: userId, preference_key: 'budget_near_limit', channel: 'telegram', enabled: value.nearLimit }, { user_id: userId, preference_key: 'budget_over_limit', channel: 'telegram', enabled: value.overLimit }], { onConflict: 'user_id,preference_key,channel' });
  if (error) throw error;
}

export async function generateTelegramLinkCode(): Promise<TelegramConnection> {
  const { data, error } = await supabase.rpc('create_telegram_link_code');
  if (error) throw error;
  const link = Array.isArray(data) ? data[0] : data;
  if (!link?.code || !link.expires_at) throw new Error('The link-code service returned an invalid response.');
  return { status: 'link_code_ready', code: link.code, expiresAt: link.expires_at };
}

export async function disconnectTelegram() {
  const { error } = await supabase.rpc('unlink_telegram');
  if (error) throw error;
}