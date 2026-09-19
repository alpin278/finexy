import type { Tables } from '../types/database';
import { supabase } from './supabase';

type WalletRow = Tables<'wallets'>;
type BalanceTransaction = Pick<Tables<'transactions'>, 'wallet_id' | 'type' | 'amount' | 'occurred_at'>;

export interface WalletBalanceRow {
  wallet_id: string;
  type: 'income' | 'expense';
  amount: number;
  occurred_at?: string;
}

export function calculateWalletBalance(openingBalance: number, transactions: WalletBalanceRow[]) {
  return transactions.reduce((balance, transaction) => balance + (transaction.type === 'income' ? transaction.amount : -transaction.amount), openingBalance);
}

export async function loadWalletBalances(walletRows: WalletRow[]) {
  const derived = await loadWalletDerivedData(walletRows);
  return derived.balances;
}

export async function loadWalletDerivedData(walletRows: WalletRow[]) {
  if (walletRows.length === 0) return { balances: new Map<string, number>(), spentThisMonth: new Map<string, number>() };
  const userId = walletRows[0].user_id;
  const { data, error } = await supabase
    .from('transactions')
    .select('wallet_id, type, amount, occurred_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .is('deleted_at', null)
    .in('type', ['income', 'expense'])
    .in('wallet_id', walletRows.map((wallet) => wallet.id));
  if (error) throw error;

  const grouped = new Map<string, WalletBalanceRow[]>();
  for (const row of (data as BalanceTransaction[])) {
    if (row.type !== 'income' && row.type !== 'expense') continue;
    const current = grouped.get(row.wallet_id) ?? [];
    current.push({ wallet_id: row.wallet_id, type: row.type, amount: Number(row.amount) });
    grouped.set(row.wallet_id, current);
  }

  const balances = new Map(walletRows.map((wallet) => [wallet.id, calculateWalletBalance(Number(wallet.opening_balance), grouped.get(wallet.id) ?? [])]));
  const currentMonth = new Date().toISOString().slice(0, 7);
  const spentThisMonth = new Map<string, number>();
  for (const row of (data as BalanceTransaction[])) {
    if (row.type === 'expense' && row.occurred_at?.startsWith(currentMonth)) spentThisMonth.set(row.wallet_id, (spentThisMonth.get(row.wallet_id) ?? 0) + Number(row.amount));
  }
  return { balances, spentThisMonth };
}
