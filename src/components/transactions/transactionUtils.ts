import type { Transaction, TransactionStatus } from '../../types/finance';
import { formatDateOnly } from '../../lib/date-time';

export function formatTransactionDate(date: string) {
  return formatDateOnly(date, 'en-GB');
}

export function formatTransactionAmount(transaction: Transaction) {
  const amount = new Intl.NumberFormat(transaction.currency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: transaction.currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: transaction.currency === 'IDR' ? 0 : 2,
    maximumFractionDigits: transaction.currency === 'IDR' ? 0 : 2,
  }).format(transaction.amount);

  if (transaction.type === 'transfer') return amount;
  return `${transaction.type === 'income' ? '+' : '-'}${amount}`;
}

export function getStatusBadgeType(status: TransactionStatus) {
  return status;
}

export function getStatusLabel(status: TransactionStatus) {
  return {
    completed: 'Completed',
    pending: 'Pending',
    canceled: 'Canceled',
  }[status];
}
