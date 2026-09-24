import type { Transaction } from '../types/finance';

export interface TransferActivityItem {
  type: 'income' | 'expense' | 'transfer';
  transferId?: string;
  transferLeg?: 'outbound' | 'inbound';
  createdAt?: string;
}

/** Groups only persisted transfer legs; transfer_id is the sole grouping key. */
export function groupLogicalActivities<T extends TransferActivityItem>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (item.type !== 'transfer' || !item.transferId) continue;
    const group = groups.get(item.transferId) ?? [];
    group.push(item);
    groups.set(item.transferId, group);
  }
  const emitted = new Set<string>();
  return items.flatMap((item) => {
    if (item.type !== 'transfer' || !item.transferId) return [{ primary: item, items: [item] }];
    if (emitted.has(item.transferId)) return [];
    emitted.add(item.transferId);
    const group = groups.get(item.transferId) ?? [item];
    return [{ primary: group.find((candidate) => candidate.transferLeg === 'outbound') ?? group[0], items: group }];
  });
}

export interface TransactionActivitySummary {
  count: number;
  income: Record<string, number>;
  expenses: Record<string, number>;
  net: Record<string, number>;
}

export function buildTransactionSummary(transactions: Transaction[]): TransactionActivitySummary {
  const income: Record<string, number> = {};
  const expenses: Record<string, number> = {};
  for (const transaction of transactions) {
    if (transaction.type === 'transfer' || transaction.status !== 'completed') continue;
    const target = transaction.type === 'income' ? income : expenses;
    target[transaction.currency] = (target[transaction.currency] ?? 0) + transaction.amount;
  }
  const currencies = new Set([...Object.keys(income), ...Object.keys(expenses)]);
  const net: Record<string, number> = {};
  for (const currency of currencies) net[currency] = (income[currency] ?? 0) - (expenses[currency] ?? 0);
  return { count: transactions.length, income, expenses, net };
}

/**
 * Builds the Transactions-page activity stream. A wallet transfer remains two
 * ledger rows in persistence, but rows sharing the same database transfer_id
 * are represented as one user activity. No heuristic date/amount matching is
 * used, so unrelated transactions cannot be combined.
 */
export function buildTransactionActivities(transactions: Transaction[]): Transaction[] {
  return groupLogicalActivities(transactions).map(({ primary: transaction, items: group }) => {
    if (transaction.type !== 'transfer' || !transaction.transferId) return transaction;
    const outbound = transaction;
    const sourceWallet = outbound.transferSourceWallet ?? group.find((item) => item.transferSourceWallet)?.transferSourceWallet ?? 'Source wallet';
    const destinationWallet = outbound.transferDestinationWallet ?? group.find((item) => item.transferDestinationWallet)?.transferDestinationWallet ?? 'Destination wallet';
    const note = group.find((item) => item.secondaryReference !== 'No note')?.secondaryReference ?? 'No note';

    return {
      ...outbound,
      id: `transfer:${transaction.transferId}`,
      description: 'Transfer',
      payee: `${sourceWallet} → ${destinationWallet}`,
      reference: outbound.transferReference ?? outbound.reference,
      secondaryReference: note,
      category: 'Transfer',
      wallet: `${sourceWallet} → ${destinationWallet}`,
      method: 'Internal wallet transfer',
      transferSourceWallet: sourceWallet,
      transferDestinationWallet: destinationWallet,
      ledgerTransactionIds: group.map((item) => item.id),
    };
  });
}
