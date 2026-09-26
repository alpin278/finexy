import type { WalletCurrencyCode } from '../types/finance';
import { supabase } from './supabase';
import { resolveUserDisplayTimeZone } from './date-time';

export interface UserDisplayPreferences {
  reportingCurrency: WalletCurrencyCode;
  locale: string;
  numberFormat: string;
  timeZone: string;
}

const supportedCurrencies: WalletCurrencyCode[] = ['USD', 'EUR', 'GBP', 'IDR'];

export async function loadUserDisplayPreferences(userId: string): Promise<UserDisplayPreferences> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('default_currency, region, number_format, timezone')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  const currency = supportedCurrencies.includes(data?.default_currency as WalletCurrencyCode)
    ? data?.default_currency as WalletCurrencyCode
    : 'USD';
  const locale = data?.region && Intl.NumberFormat.supportedLocalesOf(data.region).length ? data.region : 'en-US';
  return { reportingCurrency: currency, locale, numberFormat: data?.number_format ?? '1,234.56', timeZone: resolveUserDisplayTimeZone(data?.timezone) };
}
