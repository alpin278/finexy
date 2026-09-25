import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { supabase } from './supabase';
import { assertOnline, offlineErrorMessage } from './connectivity';

type TransferRpcResult = Database['public']['Functions']['perform_wallet_transfer']['Returns'][number];

export interface CreateWalletTransferInput {
  sourceWalletId: string;
  destinationWalletId: string;
  amount: number;
  note: string;
  idempotencyKey: string;
}

export async function createWalletTransfer(input: CreateWalletTransferInput): Promise<TransferRpcResult> {
  assertOnline();
  const { data, error } = await supabase.rpc('perform_wallet_transfer', {
    p_source_wallet_id: input.sourceWalletId,
    p_destination_wallet_id: input.destinationWalletId,
    p_amount: input.amount,
    p_note: input.note.trim() || null,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw error;
  const result = data?.[0];
  if (!result) throw new Error('The transfer completed without returning a result.');
  return result;
}

export function transferErrorMessage(error: unknown) {
  const offline = offlineErrorMessage(error);
  if (offline) return offline;
  const code = error && typeof error === 'object' && 'code' in error ? (error as PostgrestError).code : undefined;
  if (code === '42501') return 'You must be signed in and own both wallets to transfer funds.';
  if (error instanceof Error) {
    if (error.message.includes('Cross-currency transfers')) return 'Cross-currency transfers are not supported yet.';
    if (error.message.includes('settled source balance')) return 'Transfer amount exceeds the settled source balance.';
    if (error.message.includes('active wallets')) return 'Only active wallets can be used for transfers.';
    if (error.message.includes('Archived wallets')) return 'Archived wallets cannot be used for transfers.';
    if (error.message.includes('different')) return 'Choose different source and destination wallets.';
    if (error.message.includes('greater than zero')) return 'Enter an amount greater than zero.';
    if (error.message.includes('idempotency')) return 'This transfer request could not be safely retried. Please try again.';
    if (error.message.includes('signed in')) return error.message;
  }
  return 'We could not complete that transfer. Please try again.';
}
