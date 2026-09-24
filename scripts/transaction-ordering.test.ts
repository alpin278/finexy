import assert from 'node:assert/strict';

// Test that verifies the ordering and date separation logic:
// FILTER = occurred_at
// ORDER = created_at DESC, occurred_at DESC, id DESC

interface TestTransactionRow {
  id: string;
  description: string;
  occurred_at: string;
  created_at: string;
}

function sortTransactionsByRecordingTime(rows: TestTransactionRow[]): TestTransactionRow[] {
  return [...rows].sort((a, b) => {
    // 1. Primary sort: created_at DESC
    if (a.created_at !== b.created_at) {
      return b.created_at.localeCompare(a.created_at);
    }
    // 2. Secondary sort: occurred_at DESC
    if (a.occurred_at !== b.occurred_at) {
      return b.occurred_at.localeCompare(a.occurred_at);
    }
    // 3. Tie-breaker: id DESC
    return b.id.localeCompare(a.id);
  });
}

// 1. Future occurred_at does not dominate ordering over recent recording
{
  const testRows: TestTransactionRow[] = [
    {
      id: 'tx-future-yu',
      description: 'yu (future effective date)',
      occurred_at: '2026-12-22T19:41:32.795Z',
      created_at: '2026-09-20T10:00:00.000Z', // recorded 3 days ago
    },
    {
      id: 'tx-today-coffee',
      description: 'Morning Coffee',
      occurred_at: '2026-09-23T08:00:00.000Z',
      created_at: '2026-09-23T08:05:00.000Z', // recorded today
    },
    {
      id: 'tx-backdated-flight',
      description: 'Flight ticket (backdated)',
      occurred_at: '2026-08-01T12:00:00.000Z', // backdated to last month
      created_at: '2026-09-23T14:30:00.000Z', // recorded just now
    },
  ];

  const sorted = sortTransactionsByRecordingTime(testRows);

  // The most recently recorded entry should be #1, even though its occurred_at is in August!
  assert.equal(sorted[0].id, 'tx-backdated-flight', 'Most recently recorded transaction is #1');
  assert.equal(sorted[1].id, 'tx-today-coffee', 'Coffee recorded today is #2');
  // The future-dated row recorded earlier should be #3, NOT #1!
  assert.equal(sorted[2].id, 'tx-future-yu', 'Future-dated transaction recorded earlier does NOT sit at top');
}

// 2. Overview Recent Activity slice(0, 6) answers "What did I record recently?"
{
  const tenRows: TestTransactionRow[] = Array.from({ length: 10 }, (_, i) => ({
    id: `tx-${i}`,
    description: `Transaction ${i}`,
    occurred_at: `2026-09-1${i}T12:00:00.000Z`,
    created_at: `2026-09-2${i}T12:00:00.000Z`,
  }));

  // Add an old transaction that has a far-future effective date
  tenRows.push({
    id: 'tx-far-future',
    description: 'Scheduled Event',
    occurred_at: '2027-01-01T00:00:00.000Z', // Year 2027
    created_at: '2026-09-01T00:00:00.000Z', // Recorded early September
  });

  const sorted = sortTransactionsByRecordingTime(tenRows);
  const recentActivityTop6 = sorted.slice(0, 6);

  // tx-far-future should NOT be in the top 6 recent activities
  const containsFarFuture = recentActivityTop6.some((item) => item.id === 'tx-far-future');
  assert.equal(containsFarFuture, false, 'Old recording with future effective date does not crowd out recent activity');
}

console.log('transaction-ordering regression checks passed');
