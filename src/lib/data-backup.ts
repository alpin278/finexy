import type { Json } from '../types/database';
import { supabase } from './supabase';

export const FINEXY_BACKUP_FORMAT = 'finexy-backup' as const;
export const FINEXY_BACKUP_VERSION = 2 as const;

const currencies = ['USD', 'EUR', 'GBP', 'IDR'] as const;
const moneyPattern = /^-?[0-9]+(?:\.[0-9]{1,4})?$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

type BackupObject = Record<string, unknown>;

export interface BackupWallet {
  ref: string;
  name: string;
  currency: string;
  opening_balance: string;
  opening_balance_at: string;
  kind: string;
  status: string;
  monthly_limit: string | null;
  institution: string | null;
  account_mask: string | null;
  icon_identifier: string | null;
  accent_identifier: string | null;
}

export interface BackupCategory {
  ref: string;
  name: string;
  type: string;
  icon_identifier: string | null;
  accent_identifier: string | null;
  keywords: string[];
  status: string;
  archived_at: string | null;
}

export interface BackupTransaction {
  ref: string;
  wallet_ref: string;
  category_ref: string | null;
  transfer_ref: string | null;
  type: string;
  transfer_leg: string | null;
  amount: string;
  currency: string;
  payee: string | null;
  description: string | null;
  note: string | null;
  occurred_at: string;
  posted_at: string | null;
  cleared_at: string | null;
  status: string;
  source: string;
  reference: string | null;
}

export interface BackupTransactionSplit {
  ref: string;
  transaction_ref: string;
  category_ref: string;
  amount: string;
  note: string | null;
}

export interface BackupDocument {
  format: typeof FINEXY_BACKUP_FORMAT;
  version: 1 | typeof FINEXY_BACKUP_VERSION;
  exported_at: string;
  schema: { name: string; version: string };
  profile: BackupObject;
  settings: BackupObject;
  notification_preferences: BackupObject[];
  wallets: BackupWallet[];
  categories: BackupCategory[];
  category_rules: BackupObject[];
  transactions: BackupTransaction[];
  /** Present only in v2. Parent transactions remain the canonical cash-flow rows. */
  transaction_splits?: BackupTransactionSplit[];
  wallet_transfers: BackupObject[];
  budgets: BackupObject[];
  recurring_rules: BackupObject[];
}

export interface BackupPreview {
  backupDate: string;
  version: number;
  currencies: string[];
  wallets: number;
  categories: number;
  transactions: number;
  transfers: number;
  budgets: number;
  recurringRules: number;
  splits: number;
}

export interface BackupImportSummary {
  format: string;
  version: number;
  mode: 'merge' | 'restore_empty';
  already_imported: boolean;
  wallets: number;
  categories: number;
  category_rules: number;
  transactions: number;
  transfers: number;
  budgets: number;
  recurring_rules: number;
  splits?: number;
}

function asObject(value: unknown, label: string): BackupObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as BackupObject;
}

function asArray(value: unknown, label: string): BackupObject[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value.map((item, index) => asObject(item, `${label} item ${index + 1}`));
}

function requiredString(record: BackupObject, key: string, label: string) {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is missing ${key}.`);
  return value;
}

function validateDate(value: string, label: string, dateOnly = false) {
  if (dateOnly ? !datePattern.test(value) : Number.isNaN(Date.parse(value))) throw new Error(`${label} has an invalid date.`);
  if (dateOnly && Number.isNaN(Date.parse(`${value}T00:00:00Z`))) throw new Error(`${label} has an invalid date.`);
}

function validateMoney(value: unknown, label: string, allowNegative = false, allowZero = true) {
  if (typeof value !== 'string' || !moneyPattern.test(value)) throw new Error(`${label} must use up to four decimal places.`);
  const amount = Number(value);
  if (!Number.isFinite(amount) || (!allowNegative && amount < 0) || (!allowZero && amount <= 0)) throw new Error(`${label} is out of range.`);
  return value;
}

function validateRef(value: unknown, label: string, prefix: string) {
  if (typeof value !== 'string' || !new RegExp(`^${prefix}_[A-Za-z0-9_-]{1,150}$`).test(value)) throw new Error(`${label} has an invalid reference.`);
  return value;
}

function validateUniqueRefs(records: BackupObject[], label: string, prefix: string) {
  const refs = new Set<string>();
  for (const [index, record] of records.entries()) {
    const ref = validateRef(record.ref, `${label} item ${index + 1}`, prefix);
    if (refs.has(ref)) throw new Error(`${label} contains a duplicate reference.`);
    refs.add(ref);
  }
  return refs;
}

function validateBackup(value: unknown): BackupDocument {
  const root = asObject(value, 'Backup');
  if (root.format !== FINEXY_BACKUP_FORMAT) throw new Error('Unsupported backup format.');
  if (root.version !== 1 && root.version !== FINEXY_BACKUP_VERSION) throw new Error(`Unsupported backup version: ${String(root.version)}.`);
  if (typeof root.exported_at !== 'string') throw new Error('Backup export timestamp is required.');
  validateDate(root.exported_at, 'Backup export timestamp');
  const schema = asObject(root.schema, 'Backup schema');
  if (schema.name !== 'finexy') throw new Error('Backup schema is not a Finexy backup.');

  const wallets = asArray(root.wallets, 'Wallets');
  const categories = asArray(root.categories, 'Categories');
  const categoryRules = asArray(root.category_rules, 'Category rules');
  const transactions = asArray(root.transactions, 'Transactions');
  const transfers = asArray(root.wallet_transfers, 'Wallet transfers');
  const budgets = asArray(root.budgets, 'Budgets');
  const recurringRules = asArray(root.recurring_rules, 'Recurring rules');
  const splits = root.version === FINEXY_BACKUP_VERSION ? asArray(root.transaction_splits, 'Transaction splits') : [];
  const notificationPreferences = asArray(root.notification_preferences, 'Notification preferences');
  const walletRefs = validateUniqueRefs(wallets, 'Wallets', 'wallet');
  const categoryRefs = validateUniqueRefs(categories, 'Categories', 'category');
  const transactionRefs = validateUniqueRefs(transactions, 'Transactions', 'transaction');
  const transferRefs = validateUniqueRefs(transfers, 'Wallet transfers', 'transfer');
  validateUniqueRefs(splits, 'Transaction splits', 'split');
  validateUniqueRefs(categoryRules, 'Category rules', 'category_rule');
  validateUniqueRefs(budgets, 'Budgets', 'budget');
  validateUniqueRefs(recurringRules, 'Recurring rules', 'recurring_rule');

  wallets.forEach((record, index) => {
    const label = `Wallet ${index + 1}`;
    requiredString(record, 'name', label);
    if (!currencies.includes(String(record.currency) as typeof currencies[number])) throw new Error(`${label} has an unsupported currency.`);
    if (!['bank', 'cash', 'card', 'travel', 'savings'].includes(String(record.kind)) || !['active', 'inactive'].includes(String(record.status))) throw new Error(`${label} has an unsupported enum.`);
    validateMoney(record.opening_balance, `${label} opening balance`, true);
    if (record.monthly_limit !== null && record.monthly_limit !== undefined) validateMoney(record.monthly_limit, `${label} monthly limit`);
    validateDate(requiredString(record, 'opening_balance_at', label), `${label} opening date`);
  });

  categories.forEach((record, index) => {
    const label = `Category ${index + 1}`;
    requiredString(record, 'name', label);
    if (!['income', 'expense'].includes(String(record.type)) || !['active', 'inactive'].includes(String(record.status))) throw new Error(`${label} has an unsupported enum.`);
    if (!Array.isArray(record.keywords) || record.keywords.some((keyword) => typeof keyword !== 'string')) throw new Error(`${label} keywords are invalid.`);
    if (record.archived_at !== null && record.archived_at !== undefined) validateDate(String(record.archived_at), `${label} archive date`);
  });

  categoryRules.forEach((record, index) => {
    const label = `Category rule ${index + 1}`;
    validateRef(record.category_ref, label, 'category');
    if (!categoryRefs.has(String(record.category_ref)) || !['payee', 'description'].includes(String(record.field)) || !['contains', 'starts_with', 'exact_match'].includes(String(record.operator))) throw new Error(`${label} relationship or enum is invalid.`);
    requiredString(record, 'value', label);
  });

  transactions.forEach((record, index) => {
    const label = `Transaction ${index + 1}`;
    validateRef(record.wallet_ref, label, 'wallet');
    if (!walletRefs.has(String(record.wallet_ref)) || !['income', 'expense', 'transfer'].includes(String(record.type)) || !currencies.includes(String(record.currency) as typeof currencies[number]) || !['pending', 'completed', 'canceled'].includes(String(record.status)) || !['web', 'telegram', 'import', 'api', 'recurring'].includes(String(record.source))) throw new Error(`${label} relationship or enum is invalid.`);
    validateMoney(record.amount, `${label} amount`, false, false);
    validateDate(requiredString(record, 'occurred_at', label), `${label} occurred date`);
    for (const key of ['posted_at', 'cleared_at']) if (record[key] !== null && record[key] !== undefined) validateDate(String(record[key]), `${label} ${key}`);
    if (record.type === 'transfer') {
      validateRef(record.transfer_ref, label, 'transfer');
      if (!transferRefs.has(String(record.transfer_ref)) || !['outbound', 'inbound'].includes(String(record.transfer_leg)) || record.category_ref !== null) throw new Error(`${label} transfer relationship is invalid.`);
    } else {
      validateRef(record.category_ref, label, 'category');
      if (!categoryRefs.has(String(record.category_ref)) || record.transfer_ref !== null || record.transfer_leg !== null) throw new Error(`${label} category relationship is invalid.`);
    }
  });

  const splitTotals = new Map<string, number>();
  const splitCounts = new Map<string, number>();
  splits.forEach((record, index) => {
    const label = `Transaction split ${index + 1}`;
    validateRef(record.transaction_ref, label, 'transaction');
    validateRef(record.category_ref, label, 'category');
    if (!transactionRefs.has(String(record.transaction_ref)) || !categoryRefs.has(String(record.category_ref))) throw new Error(`${label} references a missing transaction or category.`);
    validateMoney(record.amount, `${label} amount`, false, false);
    if (record.note !== null && record.note !== undefined && typeof record.note !== 'string') throw new Error(`${label} note is invalid.`);
    const parent = transactions.find((transaction) => transaction.ref === record.transaction_ref)!;
    const category = categories.find((item) => item.ref === record.category_ref)!;
    if (parent.type === 'transfer' || category.type !== parent.type || category.status !== 'active' || category.archived_at) throw new Error(`${label} has an invalid parent or category.`);
    const parentRef = String(parent.ref);
    splitTotals.set(parentRef, (splitTotals.get(parentRef) ?? 0) + Number(record.amount));
    splitCounts.set(parentRef, (splitCounts.get(parentRef) ?? 0) + 1);
  });
  for (const [transactionRef, total] of splitTotals) {
    const parent = transactions.find((transaction) => transaction.ref === transactionRef)!;
    if (splitCounts.get(transactionRef)! < 2 || total !== Number(parent.amount)) throw new Error(`Split allocations for ${transactionRef} must contain at least two rows and equal the parent amount exactly.`);
  }

  transfers.forEach((record, index) => {
    const label = `Transfer ${index + 1}`;
    validateRef(record.source_wallet_ref, label, 'wallet');
    validateRef(record.destination_wallet_ref, label, 'wallet');
    if (!walletRefs.has(String(record.source_wallet_ref)) || !walletRefs.has(String(record.destination_wallet_ref)) || record.source_wallet_ref === record.destination_wallet_ref) throw new Error(`${label} wallet relationship is invalid.`);
    if (!['pending', 'completed', 'canceled'].includes(String(record.status)) || !['web', 'telegram', 'import', 'api', 'recurring'].includes(String(record.source))) throw new Error(`${label} has an unsupported enum.`);
    validateMoney(record.source_amount, `${label} source amount`, false, false);
    validateMoney(record.destination_amount, `${label} destination amount`, false, false);
    validateMoney(record.fee_amount, `${label} fee`, false);
    if (record.exchange_rate !== null && record.exchange_rate !== undefined) validateMoney(record.exchange_rate, `${label} exchange rate`, false, false);
    for (const key of ['source_transaction_ref', 'destination_transaction_ref']) if (record[key] !== null && record[key] !== undefined) { validateRef(record[key], label, 'transaction'); if (!transactionRefs.has(String(record[key]))) throw new Error(`${label} references a missing ledger leg.`); }
    if (record.status === 'completed' && (!record.source_transaction_ref || !record.destination_transaction_ref)) throw new Error(`${label} must contain both ledger legs.`);
  });

  budgets.forEach((record, index) => {
    const label = `Budget ${index + 1}`;
    validateRef(record.category_ref, label, 'category');
    if (!categoryRefs.has(String(record.category_ref)) || record.period_type !== 'monthly' || !currencies.includes(String(record.currency) as typeof currencies[number])) throw new Error(`${label} relationship or enum is invalid.`);
    validateMoney(record.limit_amount, `${label} limit`, false, false);
    const periodStart = requiredString(record, 'period_start', label);
    validateDate(periodStart, `${label} period`, true);
    if (!periodStart.endsWith('-01')) throw new Error(`${label} period must start on the first day of a month.`);
  });

  recurringRules.forEach((record, index) => {
    const label = `Recurring rule ${index + 1}`;
    validateRef(record.wallet_ref, label, 'wallet');
    validateRef(record.category_ref, label, 'category');
    if (!walletRefs.has(String(record.wallet_ref)) || !categoryRefs.has(String(record.category_ref)) || !['income', 'expense'].includes(String(record.type)) || !['weekly', 'monthly'].includes(String(record.frequency)) || typeof record.active !== 'boolean') throw new Error(`${label} relationship or enum is invalid.`);
    validateMoney(record.amount, `${label} amount`, false, false);
    const startDate = requiredString(record, 'start_date', label);
    validateDate(startDate, `${label} start date`, true);
    if (record.end_date !== null && record.end_date !== undefined) validateDate(String(record.end_date), `${label} end date`, true);
    validateDate(requiredString(record, 'next_due_at', label), `${label} next due date`);
    requiredString(record, 'local_time', label);
  });

  notificationPreferences.forEach((record, index) => {
    const label = `Notification preference ${index + 1}`;
    requiredString(record, 'preference_key', label);
    if (!['in_app', 'email', 'telegram'].includes(String(record.channel)) || typeof record.enabled !== 'boolean') throw new Error(`${label} is invalid.`);
  });

  return {
    format: FINEXY_BACKUP_FORMAT,
    version: root.version as 1 | typeof FINEXY_BACKUP_VERSION,
    exported_at: root.exported_at,
    schema: { name: String(schema.name), version: String(schema.version ?? '') },
    profile: asObject(root.profile, 'Profile'),
    settings: asObject(root.settings, 'Settings'),
    notification_preferences: notificationPreferences,
    wallets: wallets as unknown as BackupWallet[],
    categories: categories as unknown as BackupCategory[],
    category_rules: categoryRules,
    transactions: transactions as unknown as BackupTransaction[],
    ...(root.version === FINEXY_BACKUP_VERSION ? { transaction_splits: splits as unknown as BackupTransactionSplit[] } : {}),
    wallet_transfers: transfers,
    budgets,
    recurring_rules: recurringRules,
  };
}

export function parseBackupDocument(value: unknown): BackupDocument {
  return validateBackup(value);
}

export function getBackupPreview(backup: BackupDocument): BackupPreview {
  const currencies = new Set<string>();
  backup.wallets.forEach((wallet) => currencies.add(wallet.currency));
  backup.transactions.forEach((transaction) => currencies.add(transaction.currency));
  backup.wallet_transfers.forEach((transfer) => {
    const sourceWallet = backup.wallets.find((wallet) => wallet.ref === transfer.source_wallet_ref);
    const destinationWallet = backup.wallets.find((wallet) => wallet.ref === transfer.destination_wallet_ref);
    if (sourceWallet) currencies.add(sourceWallet.currency);
    if (destinationWallet) currencies.add(destinationWallet.currency);
  });
  backup.budgets.forEach((budget) => currencies.add(String(budget.currency)));
  return {
    backupDate: backup.exported_at,
    version: backup.version,
    currencies: [...currencies].sort(),
    wallets: backup.wallets.length,
    categories: backup.categories.length,
    transactions: backup.transactions.length,
    transfers: backup.wallet_transfers.length,
    budgets: backup.budgets.length,
    recurringRules: backup.recurring_rules.length,
    splits: backup.transaction_splits?.length ?? 0,
  };
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportFullBackup() {
  const { data, error } = await supabase.rpc('finexy_export_backup');
  if (error) throw error;
  const backup = parseBackupDocument(data);
  const date = backup.exported_at.slice(0, 10);
  downloadFile(new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: 'application/json;charset=utf-8' }), `finexy-backup-${date}.json`);
  return backup;
}

export async function importBackup(backup: BackupDocument, mode: 'merge' | 'restore_empty'): Promise<BackupImportSummary> {
  const { data, error } = await supabase.rpc('finexy_import_backup', { p_backup: backup as unknown as Json, p_mode: mode });
  if (error) throw error;
  return data as unknown as BackupImportSummary;
}

export function readBackupFile(file: File): Promise<BackupDocument> {
  return file.text().then((text) => {
    try {
      return parseBackupDocument(JSON.parse(text) as unknown);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error('The selected file is not valid JSON.');
      throw error;
    }
  });
}
