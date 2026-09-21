import type { WalletCurrencyCode } from '../types/finance';
import { supabase } from './supabase';

export type FxCurrency = WalletCurrencyCode;
export interface FxRateSnapshot {
  baseCurrency: FxCurrency;
  quoteCurrency: FxCurrency;
  /** One base unit equals this many quote units. */
  rate: string;
  rateDate: string;
  provider: string;
  fetchedAt: string;
}
export interface FxRateStatus { state: 'current' | 'stale' | 'missing'; rate?: FxRateSnapshot; }
export interface FxConversion { available: boolean; amount?: string; rate?: FxRateSnapshot; reason?: string; }

const SCALE = 18n;
const SCALE_FACTOR = 10n ** SCALE;
const supported: FxCurrency[] = ['USD', 'EUR', 'GBP', 'IDR'];

function parseDecimal(value: string | number) {
  const text = String(value).trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) throw new Error('Invalid decimal value.');
  const negative = text.startsWith('-'); const [whole, fraction = ''] = (negative ? text.slice(1) : text).split('.');
  return (negative ? -1n : 1n) * (BigInt(whole) * SCALE_FACTOR + BigInt((fraction.slice(0, Number(SCALE)).padEnd(Number(SCALE), '0')) || '0'));
}
function decimalString(value: bigint) {
  const negative = value < 0n; const absolute = negative ? -value : value;
  const whole = absolute / SCALE_FACTOR; const fraction = (absolute % SCALE_FACTOR).toString().padStart(Number(SCALE), '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

/** Decimal-safe multiplication. Canonical money is always converted from native amount. */
export function multiplyDecimal(amount: string | number, rate: string | number) {
  const result = (parseDecimal(amount) * parseDecimal(rate)) / SCALE_FACTOR;
  return decimalString(result);
}

export function deriveCrossRate(from: FxRateSnapshot, to: FxRateSnapshot, quoteCurrency: FxCurrency): FxRateSnapshot | null {
  if (from.baseCurrency !== to.baseCurrency || from.rateDate !== to.rateDate || from.provider !== to.provider || from.quoteCurrency !== quoteCurrency) return null;
  if (parseDecimal(to.rate) <= 0n) return null;
  return { ...from, quoteCurrency, rate: decimalString((parseDecimal(from.rate) * SCALE_FACTOR) / parseDecimal(to.rate)) };
}

function daysOld(date: string, now = new Date()) { return Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000); }
/** Weekends allow a Friday reference; older than five calendar days is stale. */
export function rateStatus(rate: FxRateSnapshot | undefined, now = new Date()): FxRateStatus {
  if (!rate) return { state: 'missing' };
  return daysOld(rate.rateDate, now) <= 5 ? { state: 'current', rate } : { state: 'stale', rate };
}

function normalize(row: { base_currency: FxCurrency; quote_currency: FxCurrency; rate: number; rate_date: string; provider: string; fetched_at: string }): FxRateSnapshot {
  return { baseCurrency: row.base_currency, quoteCurrency: row.quote_currency, rate: String(row.rate), rateDate: row.rate_date, provider: row.provider, fetchedAt: row.fetched_at };
}

/** Batched cached rate read. It never contacts an external provider. */
export async function loadLatestFxRates(currencies: readonly FxCurrency[]) {
  const unique = [...new Set(currencies.filter((currency): currency is FxCurrency => supported.includes(currency)))];
  if (unique.length < 2) return [] as FxRateSnapshot[];
  const { data, error } = await supabase.from('fx_rates').select('base_currency, quote_currency, rate, rate_date, provider, fetched_at').in('quote_currency', unique).order('rate_date', { ascending: false });
  if (error) throw error;
  const latest = new Map<string, FxRateSnapshot>();
  for (const row of data) { const rate = normalize(row); const key = `${rate.baseCurrency}:${rate.quoteCurrency}`; if (!latest.has(key)) latest.set(key, rate); }
  return [...latest.values()];
}

export async function refreshFxRates() {
  const { data, error } = await supabase.functions.invoke('refresh-fx-rates', { method: 'POST' });
  if (error) throw error;
  return data as { status: 'refreshed' | 'current'; provider: string; rate_date: string };
}

export async function loadFxCacheStatus() {
  const { data, error } = await supabase.from('fx_rates').select('provider, rate_date, fetched_at').order('rate_date', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? { provider: data.provider, rateDate: data.rate_date, fetchedAt: data.fetched_at } : null;
}

export function findRate(rates: FxRateSnapshot[], from: FxCurrency, to: FxCurrency) {
  if (from === to) return { baseCurrency: from, quoteCurrency: to, rate: '1', rateDate: new Date().toISOString().slice(0, 10), provider: 'Identity', fetchedAt: new Date().toISOString() } satisfies FxRateSnapshot;
  const direct = rates.find((rate) => rate.baseCurrency === from && rate.quoteCurrency === to);
  if (direct) return direct;
  const inverse = rates.find((rate) => rate.baseCurrency === to && rate.quoteCurrency === from);
  if (inverse) return { ...inverse, baseCurrency: from, quoteCurrency: to, rate: decimalString(SCALE_FACTOR * SCALE_FACTOR / parseDecimal(inverse.rate)) };
  const bases = [...new Set(rates.map((rate) => rate.baseCurrency))];
  for (const base of bases) { const source = rates.find((rate) => rate.baseCurrency === base && rate.quoteCurrency === from); const target = rates.find((rate) => rate.baseCurrency === base && rate.quoteCurrency === to); if (source && target) return deriveCrossRate(target, source, to) ?? undefined; }
  return undefined;
}

export function convertMoney(amount: string | number, from: FxCurrency, to: FxCurrency, rates: FxRateSnapshot[]): FxConversion {
  const rate = findRate(rates, from, to); const status = rateStatus(rate);
  if (status.state !== 'current' || !rate) return { available: false, rate, reason: status.state === 'stale' ? 'Rate is stale.' : `No cached ${from} → ${to} rate.` };
  return { available: true, amount: multiplyDecimal(amount, rate.rate), rate };
}
