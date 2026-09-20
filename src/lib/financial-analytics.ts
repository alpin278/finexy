import type { Tables } from '../types/database';
import type { WalletCurrencyCode } from '../types/finance';

export type FinancialTransactionRow = Pick<Tables<'transactions'>, 'amount' | 'currency' | 'deleted_at' | 'occurred_at' | 'status' | 'transfer_id' | 'type'>;
export interface FinancialDateRange { start: string; end: string; }
export interface FinancialTotals { income: number; expenses: number; net: number; savingsRate: number; }

export function isSettledFinancialTransaction(row: FinancialTransactionRow, range: FinancialDateRange, currency: WalletCurrencyCode) {
  return row.deleted_at === null && row.status === 'completed' && row.currency === currency
    && row.occurred_at >= range.start && row.occurred_at < range.end && row.transfer_id === null
    && (row.type === 'income' || row.type === 'expense');
}

export function calculateFinancialTotals(rows: FinancialTransactionRow[], range: FinancialDateRange, currency: WalletCurrencyCode): FinancialTotals {
  let income = 0; let expenses = 0;
  for (const row of rows) {
    if (!isSettledFinancialTransaction(row, range, currency)) continue;
    if (row.type === 'income') income += Number(row.amount); else expenses += Number(row.amount);
  }
  const net = income - expenses;
  return { income, expenses, net, savingsRate: income > 0 ? (net / income) * 100 : 0 };
}
