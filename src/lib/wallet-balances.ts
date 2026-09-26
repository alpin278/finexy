import type { Tables } from '../types/database';
import { supabase } from './supabase';
import { browserTimeZone, getLocalMonthKey } from './date-time';

type WalletRow = Tables<'wallets'>;
type BalanceTransaction = Pick<Tables<'transactions'>, 'wallet_id' | 'type' | 'amount' | 'occurred_at' | 'transfer_leg'>;

export interface WalletBalanceRow {
  wallet_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  transfer_leg?: 'outbound' | 'inbound' | null;
  occurred_at?: string;
}

export function calculateWalletBalance(openingBalance: number, transactions: WalletBalanceRow[]) {
  return transactions.reduce((balance, transaction) => {
    if (transaction.type === 'income') return balance + transaction.amount;
    if (transaction.type === 'expense') return balance - transaction.amount;
    return balance + (transaction.transfer_leg === 'inbound' ? transaction.amount : -transaction.amount);
  }, openingBalance);
}

export async function loadWalletBalances(walletRows: WalletRow[]) {
  const derived = await loadWalletDerivedData(walletRows);
  return derived.balances;
}

export async function loadWalletDerivedData(walletRows: WalletRow[], timeZone = browserTimeZone()) {
  if (walletRows.length === 0) return { balances: new Map<string, number>(), spentThisMonth: new Map<string, number>() };
  const userId = walletRows[0].user_id;
  const { data, error } = await supabase
    .from('transactions')
    .select('wallet_id, type, transfer_leg, amount, occurred_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .is('deleted_at', null)
    .in('wallet_id', walletRows.map((wallet) => wallet.id));
  if (error) throw error;

  const grouped = new Map<string, WalletBalanceRow[]>();
  for (const row of (data as BalanceTransaction[])) {
    if (row.type !== 'income' && row.type !== 'expense' && row.type !== 'transfer') continue;
    const current = grouped.get(row.wallet_id) ?? [];
    current.push({ wallet_id: row.wallet_id, type: row.type, amount: Number(row.amount), transfer_leg: row.transfer_leg });
    grouped.set(row.wallet_id, current);
  }

  const balances = new Map(walletRows.map((wallet) => [wallet.id, calculateWalletBalance(Number(wallet.opening_balance), grouped.get(wallet.id) ?? [])]));
  const currentMonth = getLocalMonthKey(new Date(), timeZone);
  const spentThisMonth = new Map<string, number>();
  for (const row of (data as BalanceTransaction[])) {
    if (row.type === 'expense' && row.occurred_at && getLocalMonthKey(row.occurred_at, timeZone) === currentMonth) spentThisMonth.set(row.wallet_id, (spentThisMonth.get(row.wallet_id) ?? 0) + Number(row.amount));
  }
  return { balances, spentThisMonth };
}
