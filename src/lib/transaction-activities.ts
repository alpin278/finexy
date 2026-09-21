import type { Transaction } from '../types/finance';

/**
 * Builds the Transactions-page activity stream. A wallet transfer remains two
 * ledger rows in persistence, but rows sharing the same database transfer_id
 * are represented as one user activity. No heuristic date/amount matching is
 * used, so unrelated transactions cannot be combined.
 */
export function buildTransactionActivities(transactions: Transaction[]): Transaction[] {
  const groupedTransfers = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    if (transaction.type !== 'transfer' || !transaction.transferId) continue;
    const group = groupedTransfers.get(transaction.transferId) ?? [];
    group.push(transaction);
    groupedTransfers.set(transaction.transferId, group);
  }

  const emittedTransfers = new Set<string>();
  return transactions.flatMap((transaction) => {
    if (transaction.type !== 'transfer' || !transaction.transferId) return [transaction];
    if (emittedTransfers.has(transaction.transferId)) return [];
    emittedTransfers.add(transaction.transferId);

    const group = groupedTransfers.get(transaction.transferId) ?? [transaction];
    const outbound = group.find((item) => item.transferLeg === 'outbound') ?? group[0];
    const sourceWallet = outbound.transferSourceWallet ?? group.find((item) => item.transferSourceWallet)?.transferSourceWallet ?? 'Source wallet';
    const destinationWallet = outbound.transferDestinationWallet ?? group.find((item) => item.transferDestinationWallet)?.transferDestinationWallet ?? 'Destination wallet';
    const note = group.find((item) => item.secondaryReference !== 'No note')?.secondaryReference ?? 'No note';

    return [{
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
    }];
  });
}
