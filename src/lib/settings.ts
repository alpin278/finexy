import type { TablesUpdate } from '../types/database';
import type { SettingsState } from '../types/settings';
import { defaultSettingsState } from '../data/settings';
import { loadOrCreateProfile } from './auth';
import { supabase } from './supabase';

function defaults(): SettingsState {
  return { ...defaultSettingsState, profile: { ...defaultSettingsState.profile }, notifications: defaultSettingsState.notifications.map((item) => ({ ...item })) };
}

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in to manage settings.');
  return data.user;
}

export interface ProfileDetails {
  name: string;
  email: string;
  location: string;
}

export async function loadProfileDetails(): Promise<ProfileDetails> {
  const user = await requireUser();
  const profile = await loadOrCreateProfile(user);
  return {
    name: profile?.display_name ?? user.email ?? '',
    email: user.email ?? profile?.email ?? '',
    location: profile?.location ?? '',
  };
}

export async function saveProfileDetails(value: Pick<ProfileDetails, 'name' | 'location'>) {
  const user = await requireUser();
  if (!value.name.trim()) throw new Error('Display name is required.');
  const profile: TablesUpdate<'profiles'> = { display_name: value.name.trim(), location: value.location.trim() || null };
  const { error } = await supabase.from('profiles').update(profile).eq('id', user.id);
  if (error) throw error;
}

export async function loadSettings(): Promise<SettingsState> {
  const user = await requireUser();
  const profile = await loadOrCreateProfile(user);
  const { error: bootstrapError } = await supabase.from('user_settings').upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (bootstrapError) throw bootstrapError;
  const { data: settings, error } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
  if (error) throw error;
  const { data: preferences, error: preferencesError } = await supabase.from('notification_preferences').select('preference_key, enabled').eq('user_id', user.id).eq('channel', 'in_app');
  if (preferencesError) throw preferencesError;
  const base = defaults(); const existing = new Map(preferences.map((item) => [item.preference_key, item.enabled]));
  const missing = base.notifications.filter((item) => !existing.has(item.id));
  if (missing.length) {
    const { error: notificationBootstrapError } = await supabase.from('notification_preferences').upsert(missing.map((item) => ({ user_id: user.id, preference_key: item.id, channel: 'in_app', enabled: item.enabled })), { onConflict: 'user_id,preference_key,channel', ignoreDuplicates: true });
    if (notificationBootstrapError) throw notificationBootstrapError;
  }
  return { ...base, profile: { name: profile?.display_name ?? user.email ?? '', email: user.email ?? '', location: profile?.location ?? '', timezone: settings.timezone }, currency: settings.default_currency, region: settings.region, dateFormat: settings.date_format, numberFormat: settings.number_format, appearance: settings.appearance as SettingsState['appearance'], transactionType: settings.default_transaction_type, entryMode: settings.entry_mode as SettingsState['entryMode'], autoCategorize: settings.auto_categorize, merchantSuggestions: settings.merchant_suggestions, confirmBeforeDeleting: settings.confirm_before_delete, notifications: base.notifications.map((item) => ({ ...item, enabled: existing.get(item.id) ?? item.enabled })) };
}

export async function saveSettings(value: SettingsState) {
  const user = await requireUser();
  if (!value.profile.name.trim()) throw new Error('Display name is required.');
  const profile: TablesUpdate<'profiles'> = { display_name: value.profile.name.trim(), location: value.profile.location.trim() || null };
  const settings: TablesUpdate<'user_settings'> = { default_currency: value.currency, region: value.region, timezone: value.profile.timezone, date_format: value.dateFormat, number_format: value.numberFormat, appearance: value.appearance, default_transaction_type: value.transactionType, entry_mode: value.entryMode, auto_categorize: value.autoCategorize, merchant_suggestions: value.merchantSuggestions, confirm_before_delete: value.confirmBeforeDeleting };
  const [{ error: profileError }, { error: settingsError }, { error: notificationError }] = await Promise.all([supabase.from('profiles').update(profile).eq('id', user.id), supabase.from('user_settings').update(settings).eq('user_id', user.id), supabase.from('notification_preferences').upsert(value.notifications.map((item) => ({ user_id: user.id, preference_key: item.id, channel: 'in_app', enabled: item.enabled })), { onConflict: 'user_id,preference_key,channel' })]);
  if (profileError) throw profileError; if (settingsError) throw settingsError; if (notificationError) throw notificationError;
}

export function settingsErrorMessage(error: unknown) {
  if (error instanceof Error && (error.message.includes('signed in') || error.message === 'Display name is required.')) return error.message;
  return 'We could not save your settings. Please try again.';
}
