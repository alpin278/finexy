import { supabase } from './supabase';

export type TelegramConnection =
  | { status: 'not_connected' }
  | { status: 'link_code_ready'; code: string; expiresAt: string }
  | { status: 'connected'; linkedAt: string | null };

export type TelegramBudgetNotificationPreferences = { nearLimit: boolean; overLimit: boolean; dailySummary: boolean; weeklySummary: boolean };
const preferenceKeys = ['budget_near_limit', 'budget_over_limit', 'daily_summary', 'weekly_summary'] as const;

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
  if (!connected) return { nearLimit: false, overLimit: false, dailySummary: false, weeklySummary: false };
  const userId = await requireUserId();
  const { data, error } = await supabase.from('notification_preferences').select('preference_key, enabled').eq('user_id', userId).eq('channel', 'telegram').in('preference_key', preferenceKeys);
  if (error) throw error;
  const existing = new Map((data ?? []).map((item) => [item.preference_key, item.enabled]));
  const missing = preferenceKeys.filter((key) => !existing.has(key));
  if (missing.length) {
    const { error: insertError } = await supabase.from('notification_preferences').upsert(missing.map((preference_key) => ({ user_id: userId, preference_key, channel: 'telegram', enabled: false })), { onConflict: 'user_id,preference_key,channel', ignoreDuplicates: true });
    if (insertError) throw insertError;
  }
  return { nearLimit: existing.get('budget_near_limit') ?? false, overLimit: existing.get('budget_over_limit') ?? false, dailySummary: existing.get('daily_summary') ?? false, weeklySummary: existing.get('weekly_summary') ?? false };
}

export async function saveTelegramBudgetNotificationPreferences(value: TelegramBudgetNotificationPreferences) {
  const userId = await requireUserId();
  if ((await loadTelegramConnection()).status !== 'connected') throw new Error('Telegram must be connected before enabling Telegram notifications.');
  const { error } = await supabase.from('notification_preferences').upsert([{ user_id: userId, preference_key: 'budget_near_limit', channel: 'telegram', enabled: value.nearLimit }, { user_id: userId, preference_key: 'budget_over_limit', channel: 'telegram', enabled: value.overLimit }, { user_id: userId, preference_key: 'daily_summary', channel: 'telegram', enabled: value.dailySummary }, { user_id: userId, preference_key: 'weekly_summary', channel: 'telegram', enabled: value.weeklySummary }], { onConflict: 'user_id,preference_key,channel' });
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
export type TelegramDiagnostics = { connection: 'connected' | 'disconnected'; worker: 'healthy' | 'needs_attention' | 'disconnected'; last_worker_at?: string | null; last_delivered_at?: string | null; last_failed_at?: string | null; failure_class?: string | null; pending: number; retryable: number; failed: number };
export async function loadTelegramDiagnostics(): Promise<TelegramDiagnostics> { const { data, error } = await (supabase as any).rpc('get_telegram_diagnostics'); if (error) throw error; return data as TelegramDiagnostics; }
export async function sendTelegramTestNotification() { const { data, error } = await (supabase as any).rpc('queue_telegram_test_notification'); if (error) throw error; return data as 'queued' | 'already_queued'; }

/**
 * Normalizes the configured public Telegram bot username.
 * Strips leading '@' or URL prefixes if inadvertently entered in configuration.
 */
export function getTelegramBotUsername(): string | null {
  const raw = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '').trim();
  return cleaned || null;
}

/**
 * Builds the Telegram deep linking URL for account connection.
 * Returns null if the bot username is not configured.
 */
export function buildTelegramDeepLink(code: string): string | null {
  const username = getTelegramBotUsername();
  if (!username) return null;
  return `https://t.me/${username}?start=${encodeURIComponent(code)}`;
}