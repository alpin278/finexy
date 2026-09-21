import type { PostgrestError } from '@supabase/supabase-js';
import { defaultWalletSeeds } from '../data/wallets';
import { defaultTransactionSeeds } from '../data/transactions';
import { loadCategoriesPage } from './categories';
import { loadWalletsPage } from './wallets';
import type { Enums, Tables, TablesInsert, TablesUpdate } from '../types/database';
import type { Transaction, TransactionStatus, WalletCurrencyCode } from '../types/finance';
import { supabase } from './supabase';
import { buildTransactionActivities, buildTransactionSummary } from './transaction-activities';

type TransactionRow = Tables<'transactions'>;
type TransactionStatusDb = Enums<'transaction_status'>;
type CurrencyDb = Enums<'currency_code'>;
type TransferRow = Tables<'wallet_transfers'>;

interface JoinedTransactionRow extends TransactionRow {
  wallet: { id: string; name: string; currency: CurrencyDb } | null;
  category: { id: string; name: string; type: 'income' | 'expense' } | null;
}

export interface TransactionCategoryOption { id: string; name: string; type: 'income' | 'expense'; }
export interface TransactionWalletOption { id: string; name: string; currency: CurrencyDb; }
export interface TransactionSummaryData {
  count: number;
  income: Record<string, number>;
  expenses: Record<string, number>;
  net: Record<string, number>;
}
export interface TransactionPageData {
  transactions: Transaction[];
  categories: TransactionCategoryOption[];
  wallets: TransactionWalletOption[];
  summary: TransactionSummaryData;
  reportingCurrency: WalletCurrencyCode;
  numberLocale: string;
  numberFormat: string;
}

export interface CreateTransactionInput {
  walletId: string;
  categoryId: string;
  type: 'income' | 'expense';
  amount: number;
  currency: CurrencyDb;
  payee: string;
  description: string;
  note: string | null;
  occurredAt: string;
  status: 'pending' | 'completed' | 'canceled';
  reference?: string | null;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in to manage transactions.');
  return data.user.id;
}

async function listTransactionRows(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, wallet:wallets(id, name, currency), category:categories(id, name, type)')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  return data as unknown as JoinedTransactionRow[];
}

async function listTransferRows(userId: string, transferIds?: string[]) {
  let query = supabase.from('wallet_transfers').select('*').eq('user_id', userId).is('deleted_at', null);
  if (transferIds?.length) query = query.in('id', transferIds);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(new Date(value));
}

function mapStatus(status: TransactionStatusDb): TransactionStatus {
  if (status === 'canceled') return 'canceled';
  return status === 'pending' ? 'pending' : 'completed';
}

function mapSource(source: string) {
  return source === 'web' ? 'Web entry' : `${source.charAt(0).toUpperCase()}${source.slice(1)} entry`;
}

function mapTransaction(row: JoinedTransactionRow, transfer?: TransferRow, walletNames?: Map<string, string>): Transaction {
  const description = row.description ?? row.payee ?? 'Untitled transaction';
  const isTransfer = row.type === 'transfer';
  const transferSourceWallet = transfer ? walletNames?.get(transfer.source_wallet_id) : undefined;
  const transferDestinationWallet = transfer ? walletNames?.get(transfer.destination_wallet_id) : undefined;
  const transferDescription = row.transfer_leg === 'outbound'
    ? `Transfer to ${transferDestinationWallet ?? 'another wallet'}`
    : `Transfer from ${transferSourceWallet ?? 'another wallet'}`;
  return {
    id: row.id,
    description: isTransfer ? transferDescription : description,
    payee: isTransfer ? transferDescription : row.payee ?? description,
    reference: row.reference ?? 'Unreferenced',
    secondaryReference: row.note ?? 'No note',
    type: row.type === 'income' ? 'income' : row.type === 'expense' ? 'expense' : 'transfer',
    category: isTransfer ? 'Transfer' : row.category?.name ?? 'Uncategorized',
    wallet: row.wallet?.name ?? 'Unknown wallet',
    method: isTransfer ? 'Wallet transfer' : mapSource(row.source),
    date: row.occurred_at.slice(0, 10),
    time: formatTime(row.occurred_at),
    amount: Number(row.amount),
    currency: row.currency,
    status: mapStatus(transfer?.status ?? row.status),
    ...(isTransfer && transferSourceWallet ? { transferSourceWallet } : {}),
    ...(isTransfer && transferDestinationWallet ? { transferDestinationWallet } : {}),
    ...(isTransfer && transfer?.reference ? { transferReference: transfer.reference } : {}),
    ...(isTransfer && row.transfer_id ? { transferId: row.transfer_id } : {}),
    ...(isTransfer && row.transfer_leg ? { transferLeg: row.transfer_leg } : {}),
  };
}

function categorySeedForMockName(name: string, type: 'income' | 'expense') {
  const normalized = name.toLowerCase();
  if (type === 'income' && normalized === 'salary') return 'salary';
  if (type === 'income' && normalized === 'freelance income') return 'freelance-income';
  if (type === 'expense' && normalized === 'food & dining') return 'food-dining';
  if (type === 'expense' && (normalized === 'travel' || normalized === 'travel / leisure')) return 'travel-flights';
  if (type === 'expense' && normalized === 'entertainment') return 'entertainment-tech';
  if (type === 'expense' && normalized === 'bills & utilities') return 'housing-bills';
  return undefined;
}

function walletSeedForMockName(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('usd main')) return 'usd-main';
  if (normalized.includes('eur travel')) return 'eur-travel';
  if (normalized.includes('cash wallet')) return 'cash';
  if (normalized.includes('visa')) return 'visa-6782';
  if (normalized.includes('mastercard')) return 'mastercard-4356';
  return undefined;
}

async function deterministicId(userId: string, key: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${userId}:${key}`)));
  const hex = Array.from(bytes.slice(0, 16), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(8 | (Number.parseInt(hex[16], 16) & 3)).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`;
}

function mockOccurredAt(date: string, time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return `${date}T12:00:00Z`;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return `${date}T${String(hour).padStart(2, '0')}:${match[2]}:00Z`;
}

async function reconcileSeedOpeningBalances(userId: string, walletRows: Tables<'wallets'>[]) {
  // Phase 14 persisted the old mock balances as opening_balance. Convert only
  // deterministic Phase 14 seed wallets to true pre-seed openings before insert.
  const netBySeed = new Map<string, number>();
  for (const transaction of defaultTransactionSeeds) {
    if (transaction.status !== 'completed') continue;
    const seedId = walletSeedForMockName(transaction.wallet);
    if (!seedId) continue;
    const net = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    netBySeed.set(seedId, (netBySeed.get(seedId) ?? 0) + net);
  }
  const walletById = new Map(walletRows.map((wallet) => [wallet.id, wallet]));
  for (const seed of defaultWalletSeeds) {
    const walletId = await deterministicId(userId, `wallet:${seed.seedId}`);
    const wallet = walletById.get(walletId);
    const net = netBySeed.get(seed.seedId) ?? 0;
    if (!wallet || Number(wallet.opening_balance) !== seed.openingBalance || net === 0) continue;
    const targetOpeningBalance = seed.openingBalance - net;
    const { error } = await supabase.from('wallets').update({ opening_balance: targetOpeningBalance }).eq('id', wallet.id).eq('user_id', userId);
    if (error) throw error;
  }
}

async function bootstrapDefaultTransactions(userId: string, walletRows: Tables<'wallets'>[], categoryOptions: TransactionCategoryOption[], activeRows: JoinedTransactionRow[]) {
  if (activeRows.length > 0) return;
  const { data: historicalRows, error: historicalError } = await supabase.from('transactions').select('external_id').eq('user_id', userId).like('external_id', 'phase15:demo:%');
  if (historicalError) throw historicalError;
  if (historicalRows.length > 0) return;

  const walletsBySeed = new Map<string, Tables<'wallets'>>();
  for (const seed of defaultWalletSeeds) {
    const walletId = await deterministicId(userId, `wallet:${seed.seedId}`);
    const wallet = walletRows.find((row) => row.id === walletId);
    if (wallet) walletsBySeed.set(seed.seedId, wallet);
  }
  const categoriesBySeed = new Map<string, TransactionCategoryOption>();
  for (const category of categoryOptions) {
    const seedId = categorySeedForMockName(category.name, category.type);
    if (seedId) categoriesBySeed.set(seedId, category);
  }
  const resolved = defaultTransactionSeeds.map((transaction) => {
    const type = transaction.type === 'income' ? 'income' : 'expense';
    const walletSeed = walletSeedForMockName(transaction.wallet);
    const categorySeed = categorySeedForMockName(transaction.category, type);
    return { transaction, wallet: walletSeed ? walletsBySeed.get(walletSeed) : undefined, category: categorySeed ? categoriesBySeed.get(categorySeed) : undefined };
  });
  if (resolved.some((item) => !item.wallet || !item.category)) return;

  await reconcileSeedOpeningBalances(userId, walletRows);
  for (const item of resolved) {
    const { transaction, wallet, category } = item;
    const id = await deterministicId(userId, `transaction:${transaction.id}`);
    const payload: TablesInsert<'transactions'> = {
      id,
      user_id: userId,
      wallet_id: wallet!.id,
      category_id: category!.id,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency as CurrencyDb,
      payee: transaction.payee,
      description: transaction.description,
      note: transaction.secondaryReference,
      occurred_at: mockOccurredAt(transaction.date, transaction.time),
      status: transaction.status === 'completed' ? 'completed' : 'pending',
      source: 'web',
      reference: transaction.reference,
      external_id: `phase15:demo:${transaction.id}`,
      idempotency_key: `phase15:demo:${transaction.id}`,
    };
    const { error } = await supabase.from('transactions').upsert(payload, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  }
}

export async function loadTransactionsPage(): Promise<TransactionPageData> {
  const userId = await requireUserId();
  const [walletPage, categoryPage, activeRows] = await Promise.all([loadWalletsPage(), loadCategoriesPage(), listTransactionRows(userId)]);
  const walletOptions = walletPage.wallets.map((wallet) => ({ id: wallet.id, name: wallet.name, currency: wallet.currency as CurrencyDb }));
  const categoryOptions = categoryPage.categories.filter((category) => category.status === 'active').map((category) => ({ id: category.id, name: category.name, type: category.type }));
  await bootstrapDefaultTransactions(userId, await listRawWallets(userId), categoryOptions, activeRows);
  const rows = await listTransactionRows(userId);
  const transferRows = await listTransferRows(userId, rows.flatMap((row) => row.transfer_id ? [row.transfer_id] : []));
  const walletNames = new Map(walletOptions.map((wallet) => [wallet.id, wallet.name]));
  const transfersById = new Map(transferRows.map((transfer) => [transfer.id, transfer]));
  const transactions = buildTransactionActivities(rows.map((row) => mapTransaction(row, row.transfer_id ? transfersById.get(row.transfer_id) : undefined, walletNames)));
  return {
    transactions,
    categories: categoryOptions,
    wallets: walletOptions,
    summary: buildTransactionSummary(transactions),
    reportingCurrency: walletPage.displayPreferences.reportingCurrency,
    numberLocale: walletPage.displayPreferences.locale,
    numberFormat: walletPage.displayPreferences.numberFormat,
  };
}

async function listRawWallets(userId: string) {
  const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId).is('deleted_at', null);
  if (error) throw error;
  return data;
}

export async function getTransaction(transactionId: string) {
  const userId = await requireUserId();
  const { data, error } = await supabase.from('transactions').select('*, wallet:wallets(id, name, currency), category:categories(id, name, type)').eq('id', transactionId).eq('user_id', userId).is('deleted_at', null).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as JoinedTransactionRow;
  const transfer = row.transfer_id ? (await listTransferRows(userId, [row.transfer_id]))[0] : undefined;
  return mapTransaction(row, transfer);
}

async function walletCurrency(userId: string, walletId: string) {
  const { data, error } = await supabase.from('wallets').select('id, currency, deleted_at').eq('id', walletId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data || data.deleted_at) throw new Error('Choose an active wallet owned by you.');
  return data.currency;
}

async function validateCategory(userId: string, categoryId: string, type: 'income' | 'expense') {
  const { data, error } = await supabase.from('categories').select('id, type, archived_at').eq('id', categoryId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data || data.archived_at) throw new Error('Choose an active category owned by you.');
  if (data.type !== type) throw new Error(`Choose an ${type} category for this transaction.`);
}

function statusForDatabase(status: TransactionStatus): 'pending' | 'completed' | 'canceled' {
  if (status === 'canceled') return 'canceled';
  return status === 'completed' ? 'completed' : 'pending';
}

export async function createTransaction(input: CreateTransactionInput) {
  const userId = await requireUserId();
  const currency = await walletCurrency(userId, input.walletId);
  await validateCategory(userId, input.categoryId, input.type);
  if (currency !== input.currency) throw new Error('Transaction currency must match the selected wallet.');
  const payload: TablesInsert<'transactions'> = { user_id: userId, wallet_id: input.walletId, category_id: input.categoryId, type: input.type, amount: input.amount, currency, payee: input.payee.trim(), description: input.description.trim(), note: input.note?.trim() || null, occurred_at: input.occurredAt, status: input.status, source: 'web', reference: input.reference?.trim() || null };
  const { data, error } = await supabase.from('transactions').insert(payload).select('*, wallet:wallets(id, name, currency), category:categories(id, name, type)').single();
  if (error) throw error;
  return mapTransaction(data as unknown as JoinedTransactionRow);
}

export async function updateTransaction(transactionId: string, input: UpdateTransactionInput) {
  const userId = await requireUserId();
  const walletId = input.walletId;
  const categoryId = input.categoryId;
  const type = input.type;
  const currency = walletId ? await walletCurrency(userId, walletId) : input.currency;
  if (categoryId && type) await validateCategory(userId, categoryId, type);
  const payload: TablesUpdate<'transactions'> = {
    ...(walletId === undefined ? {} : { wallet_id: walletId }),
    ...(categoryId === undefined ? {} : { category_id: categoryId }),
    ...(type === undefined ? {} : { type }),
    ...(input.amount === undefined ? {} : { amount: input.amount }),
    ...(currency === undefined ? {} : { currency }),
    ...(input.payee === undefined ? {} : { payee: input.payee.trim() }),
    ...(input.description === undefined ? {} : { description: input.description.trim() }),
    ...(input.note === undefined ? {} : { note: input.note?.trim() || null }),
    ...(input.occurredAt === undefined ? {} : { occurred_at: input.occurredAt }),
    ...(input.status === undefined ? {} : { status: statusForDatabase(input.status) }),
    ...(input.reference === undefined ? {} : { reference: input.reference?.trim() || null }),
  };
  const { data, error } = await supabase.from('transactions').update(payload).eq('id', transactionId).eq('user_id', userId).is('deleted_at', null).select('*, wallet:wallets(id, name, currency), category:categories(id, name, type)').single();
  if (error) throw error;
  return mapTransaction(data as unknown as JoinedTransactionRow);
}

export async function archiveTransaction(transactionId: string) {
  const userId = await requireUserId();
  const { error } = await supabase.from('transactions').update({ deleted_at: new Date().toISOString() }).eq('id', transactionId).eq('user_id', userId).is('deleted_at', null);
  if (error) throw error;
}

export function transactionErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? (error as PostgrestError).code : undefined;
  if (code === '23503') return 'Choose a wallet and category owned by your account.';
  if (code === '23514') return 'Check the transaction amount and ledger fields.';
  if (code === '42501') return 'You do not have permission to change this transaction.';
  if (error instanceof Error && (error.message.includes('category') || error.message.includes('wallet') || error.message.includes('currency'))) return error.message;
  if (error instanceof Error && error.message === 'You must be signed in to manage transactions.') return error.message;
  return 'We could not save that transaction change. Please try again.';
}
