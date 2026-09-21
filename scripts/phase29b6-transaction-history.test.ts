import assert from 'node:assert/strict';
import { occurredAtForTransactionDate } from '../src/lib/transaction-timestamp.ts';
import { groupLogicalActivities } from '../src/lib/transaction-activities.ts';

assert.equal(
  occurredAtForTransactionDate('2026-09-21', new Date('2026-09-21T16:25:30.456Z')),
  '2026-09-21T16:25:30.456Z',
  'a manual entry keeps its selected date and recording time',
);

const activities = groupLogicalActivities([
  { id: 'web-expense', type: 'expense' as const },
  { id: 'telegram-income', type: 'income' as const },
  { id: 'transfer-in', type: 'transfer' as const, transferId: 'transfer-1', transferLeg: 'inbound' as const },
  { id: 'transfer-out', type: 'transfer' as const, transferId: 'transfer-1', transferLeg: 'outbound' as const },
]);

assert.deepEqual(
  activities.map(({ primary }) => primary.id),
  ['web-expense', 'telegram-income', 'transfer-out'],
  'normal web and Telegram rows survive while persisted transfer legs group only by transfer_id',
);

console.log('phase29b6 deterministic transaction-history checks passed');
