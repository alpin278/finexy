import type { Transaction, TransactionStatus } from '../../types/finance';

export function formatTransactionDate(date: string) {
  const parsedDate = new Date(`${date}T12:00:00`);

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
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
