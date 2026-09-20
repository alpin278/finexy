import { supabase } from './supabase';

export type TelegramConnection =
  | { status: 'not_connected' }
  | { status: 'link_code_ready'; code: string; expiresAt: string }
  | { status: 'connected'; linkedAt: string | null };

export async function loadTelegramConnection(): Promise<TelegramConnection> {
  const { data, error } = await supabase
    .from('user_integrations')
    .select('linked_at')
    .eq('provider', 'telegram')
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data ? { status: 'connected', linkedAt: data.linked_at } : { status: 'not_connected' };
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
