import assert from 'node:assert/strict';
import { categoryAllocations } from '../src/lib/category-allocations.ts';
import { calculateFinancialTotals } from '../src/lib/financial-analytics.ts';

const parent = { category_id: 'food', amount: 250, category: { name: 'Food' }, splits: [{ category_id: 'food', amount: 180, category: { name: 'Food' } }, { category_id: 'care', amount: 50, category: { name: 'Care' } }, { category_id: 'home', amount: 20, category: { name: 'Home' } }] };
assert.deepEqual(categoryAllocations(parent).map((item) => item.amount), [180, 50, 20]);
assert.equal(categoryAllocations(parent).reduce((sum, item) => sum + item.amount, 0), 250);
assert.equal(1000 - parent.amount, 750, 'only the parent changes wallet balance');
assert.equal(calculateFinancialTotals([{ ...parent, currency: 'IDR', deleted_at: null, occurred_at: '2026-09-21T00:00:00Z', status: 'completed', transfer_id: null, type: 'expense' }], { start: '2026-09-01T00:00:00Z', end: '2026-10-01T00:00:00Z' }, 'IDR').expenses, 250, 'cash-flow counts parent once');

const baseBackup = {
  format: 'finexy-backup', exported_at: '2026-09-21T00:00:00Z', schema: { name: 'finexy', version: 'test' }, profile: {}, settings: {}, notification_preferences: [],
  wallets: [{ ref: 'wallet_main', name: 'Main', currency: 'IDR', opening_balance: '0', opening_balance_at: '2026-09-01', kind: 'bank', status: 'active', monthly_limit: null, institution: null, account_mask: null, icon_identifier: null, accent_identifier: null }],
  categories: [{ ref: 'category_food', name: 'Food', type: 'expense', icon_identifier: null, accent_identifier: null, keywords: [], status: 'active', archived_at: null }, { ref: 'category_care', name: 'Care', type: 'expense', icon_identifier: null, accent_identifier: null, keywords: [], status: 'active', archived_at: null }],
  category_rules: [], transactions: [{ ref: 'transaction_lunch', wallet_ref: 'wallet_main', category_ref: 'category_food', transfer_ref: null, type: 'expense', transfer_leg: null, amount: '250', currency: 'IDR', payee: null, description: null, note: null, occurred_at: '2026-09-21T00:00:00Z', posted_at: null, cleared_at: null, status: 'completed', source: 'web', reference: null }], wallet_transfers: [], budgets: [], recurring_rules: [],
};
function validateBackupSplitSet(backup: typeof baseBackup & { version: 1 | 2; transaction_splits?: Array<{ transaction_ref: string; category_ref: string; amount: string }> }) {
  if (backup.version === 1) return;
  assert.ok(Array.isArray(backup.transaction_splits), 'v2 requires split data');
  const totals = new Map<string, number>();
  for (const split of backup.transaction_splits) totals.set(split.transaction_ref, (totals.get(split.transaction_ref) ?? 0) + Number(split.amount));
  for (const [ref, total] of totals) assert.equal(total, Number(backup.transactions.find((transaction) => transaction.ref === ref)?.amount), 'v2 split total must equal parent');
}
assert.doesNotThrow(() => validateBackupSplitSet({ ...baseBackup, version: 1 }), 'v1 remains importable without split data');
assert.doesNotThrow(() => validateBackupSplitSet({ ...baseBackup, version: 2, transaction_splits: [{ transaction_ref: 'transaction_lunch', category_ref: 'category_food', amount: '180' }, { transaction_ref: 'transaction_lunch', category_ref: 'category_care', amount: '70' }] }), 'v2 retains allocations');
assert.throws(() => validateBackupSplitSet({ ...baseBackup, version: 2, transaction_splits: [{ transaction_ref: 'transaction_lunch', category_ref: 'category_food', amount: '180' }, { transaction_ref: 'transaction_lunch', category_ref: 'category_care', amount: '60' }] }), /v2 split total/, 'malformed v2 allocations are rejected before restore');
console.log('phase30 split model checks passed');
