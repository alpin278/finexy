import assert from 'node:assert/strict';

export function formatNotificationTime(isoDate, now = new Date()) {
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Just now';
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function mapNotificationRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    metadata: (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? row.metadata
      : {}),
    readAt: row.read_at,
    createdAt: row.created_at,
    dedupeKey: row.dedupe_key,
  };
}

// 1. Time formatting tests
{
  const base = new Date('2026-09-24T12:00:00Z');

  // Just now (< 60s)
  const justNow = new Date('2026-09-24T11:59:30Z').toISOString();
  assert.equal(formatNotificationTime(justNow, base), 'Just now');

  // Minutes ago (< 60m)
  const fiveMinAgo = new Date('2026-09-24T11:55:00Z').toISOString();
  assert.equal(formatNotificationTime(fiveMinAgo, base), '5m ago');

  const fiftyNineMinAgo = new Date('2026-09-24T11:01:00Z').toISOString();
  assert.equal(formatNotificationTime(fiftyNineMinAgo, base), '59m ago');

  // Hours ago (< 24h)
  const twoHoursAgo = new Date('2026-09-24T10:00:00Z').toISOString();
  assert.equal(formatNotificationTime(twoHoursAgo, base), '2h ago');

  // Yesterday
  const yesterday = new Date('2026-09-23T10:00:00Z').toISOString();
  assert.equal(formatNotificationTime(yesterday, base), 'Yesterday');

  // Days ago (< 7d)
  const fourDaysAgo = new Date('2026-09-20T10:00:00Z').toISOString();
  assert.equal(formatNotificationTime(fourDaysAgo, base), '4d ago');

  // Specific date (> 7d)
  const tenDaysAgo = new Date('2026-09-14T10:00:00Z').toISOString();
  assert.equal(formatNotificationTime(tenDaysAgo, base), 'Sep 14');

  // Future/clock drift
  const future = new Date('2026-09-24T12:01:00Z').toISOString();
  assert.equal(formatNotificationTime(future, base), 'Just now');

  console.log('✓ Time formatting tests passed.');
}

// 2. Row mapping tests
{
  const sampleRow = {
    id: 'a0000000-0000-0000-0000-000000000001',
    user_id: 'b0000000-0000-0000-0000-000000000002',
    type: 'budget_near_limit',
    title: 'Budget almost reached',
    message: 'Food & Dining has reached 82% of its September budget.',
    metadata: {
      budget_id: 'c0000000-0000-0000-0000-000000000003',
      category_id: 'd0000000-0000-0000-0000-000000000004',
      category_name: 'Food & Dining',
      spent: 820000,
      limit: 1000000,
      currency: 'IDR',
      progress: 82.0,
      period_start: '2026-09-01',
    },
    read_at: null,
    created_at: '2026-09-24T10:00:00Z',
    dedupe_key: 'c0000000-0000-0000-0000-000000000003:2026-09-01:budget_near_limit',
  };

  const mapped = mapNotificationRow(sampleRow);
  assert.equal(mapped.id, sampleRow.id);
  assert.equal(mapped.userId, sampleRow.user_id);
  assert.equal(mapped.type, 'budget_near_limit');
  assert.equal(mapped.title, sampleRow.title);
  assert.equal(mapped.message, sampleRow.message);
  assert.equal(mapped.metadata.progress, 82.0);
  assert.equal(mapped.readAt, null);
  assert.equal(mapped.dedupeKey, sampleRow.dedupe_key);

  // Row mapping with invalid / non-object metadata
  const mappedFallback = mapNotificationRow({
    ...sampleRow,
    metadata: null,
  });
  assert.deepEqual(mappedFallback.metadata, {});

  console.log('✓ Row mapping tests passed.');
}

// 3. Bell badge formatting and accessibility label semantics
{
  function getBadgeLabel(unreadCount) {
    if (unreadCount === 0) return null;
    return unreadCount > 9 ? '9+' : String(unreadCount);
  }

  function getAriaLabel(unreadCount) {
    return unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';
  }

  assert.equal(getBadgeLabel(0), null);
  assert.equal(getBadgeLabel(1), '1');
  assert.equal(getBadgeLabel(5), '5');
  assert.equal(getBadgeLabel(9), '9');
  assert.equal(getBadgeLabel(10), '9+');
  assert.equal(getBadgeLabel(99), '9+');

  assert.equal(getAriaLabel(0), 'Notifications');
  assert.equal(getAriaLabel(1), 'Notifications, 1 unread');
  assert.equal(getAriaLabel(3), 'Notifications, 3 unread');
  assert.equal(getAriaLabel(15), 'Notifications, 15 unread');

  console.log('✓ Bell badge and accessibility label semantics passed.');
}

console.log('\nALL NOTIFICATION UI UNIT TESTS PASSED!');
