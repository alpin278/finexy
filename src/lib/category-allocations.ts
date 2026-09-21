/** Category attribution only. Parent amounts remain the sole cash-flow ledger values. */
export interface CategoryAllocationSource {
  category_id: string | null;
  amount: number;
  category?: { id?: string; name: string } | null;
  splits?: Array<{ category_id: string; amount: number; category?: { id?: string; name: string } | null }>;
}

export function categoryAllocations(row: CategoryAllocationSource) {
  if (row.splits?.length) return row.splits.map((split) => ({ categoryId: split.category_id, amount: Number(split.amount), label: split.category?.name ?? 'Archived category' }));
  return [{ categoryId: row.category_id ?? 'uncategorized', amount: Number(row.amount), label: row.category?.name ?? 'Uncategorized' }];
}
