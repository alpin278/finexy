import { supabase } from './supabase';

export interface LoadedTransactionSplit {
  id: string;
  transaction_id: string;
  category_id: string;
  amount: number;
  note: string | null;
  category: { id: string; name: string } | null;
}

/** Fetch allocations once per page and attach them in memory; no relation embed or N+1 query. */
export async function loadTransactionSplits(userId: string, transactionIds: string[]) {
  const byTransaction = new Map<string, LoadedTransactionSplit[]>();
  if (!transactionIds.length) return byTransaction;
  const { data, error } = await (supabase as any)
    .from('transaction_splits')
    .select('id, transaction_id, category_id, amount, note, category:categories(id, name)')
    .eq('user_id', userId)
    .in('transaction_id', transactionIds)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  for (const split of (data ?? []) as LoadedTransactionSplit[]) {
    const values = byTransaction.get(split.transaction_id) ?? [];
    values.push(split);
    byTransaction.set(split.transaction_id, values);
  }
  return byTransaction;
}
