import type { PostgrestError } from '@supabase/supabase-js';
import { defaultWalletSeeds, walletPresentationMetadata } from '../data/wallets';
import type { Enums, Tables, TablesInsert, TablesUpdate } from '../types/database';
import type { Wallet, WalletCurrencyCode, WalletStatus } from '../types/finance';
import { supabase } from './supabase';

type WalletRow = Tables<'wallets'>;
type WalletCurrency = Enums<'currency_code'>;
type WalletKind = Enums<'wallet_kind'>;
type WalletDbStatus = Enums<'wallet_status'>;

export interface CreateWalletInput {
  name: string;
  currency: WalletCurrency;
  openingBalance: number;
  type: WalletKind;
  monthlyLimit: number | null;
  accountMask: string | null;
  institution?: string | null;
  status: WalletDbStatus;
}

export type UpdateWalletInput = Partial<Omit<CreateWalletInput, 'openingBalance'>> & { openingBalance?: number };

export interface WalletPageData { wallets: Wallet[]; }

const currencyMetadata: Record<WalletCurrencyCode, { symbol: string; flag: string }> = {
  USD: { symbol: '$', flag: '🇺🇸' },
  EUR: { symbol: '€', flag: '🇪🇺' },
  GBP: { symbol: '£', flag: '🇬🇧' },
  IDR: { symbol: 'Rp', flag: '🇮🇩' },
};

export function formatWalletAmount(amount: number, currency: WalletCurrencyCode) {
  if (currency === 'IDR') return `Rp${amount.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`;
  return `${currencyMetadata[currency].symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function walletCurrencyMeta(currency: WalletCurrencyCode) { return currencyMetadata[currency]; }

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in to manage wallets.');
  return data.user.id;
}

async function listWalletRows(userId: string) {
  const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

function seedForWallet(row: WalletRow) { return defaultWalletSeeds.find((seed) => seed.name.toLowerCase() === row.name.toLowerCase() && seed.currency === row.currency); }
function mapStatus(status: WalletDbStatus): WalletStatus { return status === 'active' ? 'Active' : 'Inactive'; }

function mapWallet(row: WalletRow): Wallet {
  const currency = row.currency as WalletCurrencyCode;
  const seed = seedForWallet(row);
  const metadata = seed ? walletPresentationMetadata[seed.seedId] : undefined;
  return {
    id: row.id,
    currency,
    symbol: currencyMetadata[currency].symbol,
    flag: currencyMetadata[currency].flag,
    name: row.name,
    balance: Number(row.opening_balance),
    monthlyLimit: row.monthly_limit === null ? null : Number(row.monthly_limit),
    status: mapStatus(row.status),
    type: row.kind,
    ...(row.account_mask ? { accountMask: row.account_mask } : {}),
    ...(row.institution ? { institution: row.institution } : {}),
    ...(metadata ?? {}),
  };
}

async function defaultWalletId(userId: string, seed: (typeof defaultWalletSeeds)[number]) {
  const input = `${userId}:wallet:${seed.seedId}`;
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)));
  const hex = Array.from(bytes.slice(0, 16), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(8 | (Number.parseInt(hex[16], 16) & 3)).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`;
}

async function bootstrapDefaults(userId: string, walletRows: WalletRow[]) {
  if (walletRows.length > 0) return walletRows;
  for (const seed of defaultWalletSeeds) {
    const payload: TablesInsert<'wallets'> = {
      id: await defaultWalletId(userId, seed),
      user_id: userId,
      name: seed.name,
      currency: seed.currency,
      opening_balance: seed.openingBalance,
      kind: seed.type,
      status: seed.status === 'Active' ? 'active' : 'inactive',
      monthly_limit: seed.monthlyLimit,
      institution: seed.institution ?? null,
      account_mask: seed.accountMask ?? null,
    };
    const { error } = await supabase.from('wallets').upsert(payload, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  }
  return listWalletRows(userId);
}

export async function loadWalletsPage(): Promise<WalletPageData> {
  const userId = await requireUserId();
  const walletRows = await bootstrapDefaults(userId, await listWalletRows(userId));
  return { wallets: walletRows.map(mapWallet) };
}

export async function getWallet(walletId: string) {
  const userId = await requireUserId();
  const { data, error } = await supabase.from('wallets').select('*').eq('id', walletId).eq('user_id', userId).is('deleted_at', null).maybeSingle();
  if (error) throw error;
  return data ? mapWallet(data) : null;
}

export async function createWallet(input: CreateWalletInput) {
  const userId = await requireUserId();
  const payload: TablesInsert<'wallets'> = {
    user_id: userId,
    name: input.name.trim(),
    currency: input.currency,
    opening_balance: input.openingBalance,
    kind: input.type,
    status: input.status,
    monthly_limit: input.monthlyLimit,
    account_mask: input.accountMask,
    institution: input.institution ?? null,
  };
  const { data, error } = await supabase.from('wallets').insert(payload).select('*').single();
  if (error) throw error;
  return mapWallet(data);
}

export async function updateWallet(walletId: string, input: UpdateWalletInput) {
  const userId = await requireUserId();
  const payload: TablesUpdate<'wallets'> = {
    ...(input.name === undefined ? {} : { name: input.name.trim() }),
    ...(input.currency === undefined ? {} : { currency: input.currency }),
    ...(input.openingBalance === undefined ? {} : { opening_balance: input.openingBalance }),
    ...(input.type === undefined ? {} : { kind: input.type }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.monthlyLimit === undefined ? {} : { monthly_limit: input.monthlyLimit }),
    ...(input.accountMask === undefined ? {} : { account_mask: input.accountMask }),
    ...(input.institution === undefined ? {} : { institution: input.institution }),
  };
  const { data, error } = await supabase.from('wallets').update(payload).eq('id', walletId).eq('user_id', userId).is('deleted_at', null).select('*').single();
  if (error) throw error;
  return mapWallet(data);
}

export async function archiveWallet(walletId: string) {
  const userId = await requireUserId();
  const { error } = await supabase.from('wallets').update({ deleted_at: new Date().toISOString() }).eq('id', walletId).eq('user_id', userId).is('deleted_at', null);
  if (error) throw error;
}

export function walletErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? (error as PostgrestError).code : undefined;
  if (code === '23505') return 'A wallet with these details already exists.';
  if (code === '23514') return 'Check the wallet name and monthly limit values.';
  if (code === '23503') return 'This wallet is still referenced by existing records.';
  if (code === '42501') return 'You do not have permission to change this wallet.';
  if (error instanceof Error && error.message === 'You must be signed in to manage wallets.') return error.message;
  return 'We could not save that wallet change. Please try again.';
}
