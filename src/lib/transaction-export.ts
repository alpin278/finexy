import type { Transaction, TransactionStatus, TransactionType } from '../types/finance';

export interface TransactionExportFilters {
  dateFrom: string;
  dateTo: string;
  type: 'all' | TransactionType;
  wallet: string;
  category: string;
  status: 'all' | TransactionStatus;
}

function spreadsheetCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function csvCell(value: unknown) {
  const text = spreadsheetCell(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function filterTransactionsForExport(transactions: Transaction[], filters: TransactionExportFilters) {
  return transactions.filter((transaction) => {
    if (filters.dateFrom && transaction.date < filters.dateFrom) return false;
    if (filters.dateTo && transaction.date > filters.dateTo) return false;
    if (filters.type !== 'all' && transaction.type !== filters.type) return false;
    if (filters.wallet !== 'all' && transaction.wallet !== filters.wallet && transaction.transferSourceWallet !== filters.wallet && transaction.transferDestinationWallet !== filters.wallet) return false;
    if (filters.category !== 'all' && transaction.category !== filters.category) return false;
    if (filters.status !== 'all' && transaction.status !== filters.status) return false;
    return true;
  });
}

export function transactionsToCsv(transactions: Transaction[]) {
  const headers = ['Date', 'Time', 'Type', 'Amount', 'Currency', 'Wallet', 'Category', 'Is Split', 'Split Count', 'Split Summary', 'Status', 'Description', 'Payee', 'Note', 'Source'];
  const rows = transactions.map((transaction) => [
    transaction.date,
    transaction.time,
    transaction.type,
    transaction.amount,
    transaction.currency,
    transaction.wallet,
    transaction.category,
    transaction.splits?.length ? 'Yes' : 'No',
    transaction.splits?.length ?? 0,
    transaction.splits?.map((split) => `${split.category}: ${split.amount}`).join('; ') ?? '',
    transaction.status,
    transaction.description,
    transaction.payee,
    transaction.secondaryReference === 'No note' ? '' : transaction.secondaryReference,
    transaction.method,
  ]);
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export function downloadTransactionsCsv(transactions: Transaction[], filters: TransactionExportFilters) {
  const selected = filterTransactionsForExport(transactions, filters);
  const blob = new Blob([transactionsToCsv(selected)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `finexy-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return selected.length;
}
