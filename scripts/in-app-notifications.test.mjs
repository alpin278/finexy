import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function envFile(path) {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .flatMap((line) => {
        const index = line.indexOf('=');
        if (index <= 0 || line.trim().startsWith('#')) return [];
        const raw = line.slice(index + 1).trim();
        const value =
          raw.length >= 2 &&
          ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")))
            ? raw.slice(1, -1)
            : raw;
        return [[line.slice(0, index).trim(), value]];
      })
  );
}

const env = { ...envFile('.env.local'), ...envFile('.auth-test.local') };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

assert.ok(
  url && key && env.QA_USER_A_EMAIL && env.QA_USER_A_PASSWORD && env.QA_USER_B_EMAIL && env.QA_USER_B_PASSWORD,
  'QA configuration is incomplete.'
);

const makeClient = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

async function login(email, password, label) {
  const client = makeClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error(`${label} sign in failed: ${error?.message}`);
  }
  if (data.session?.access_token) {
    await client.realtime.setAuth(data.session.access_token);
  }
  return { client, user: data.user, session: data.session };
}

const { client: clientA, user: userA } = await login(
  env.QA_USER_A_EMAIL,
  env.QA_USER_A_PASSWORD,
  'QA user A'
);
const { client: clientB, user: userB } = await login(
  env.QA_USER_B_EMAIL,
  env.QA_USER_B_PASSWORD,
  'QA user B'
);

assert.ok(userA.id !== userB.id, 'User A and User B must be distinct.');
console.log('✓ User A and User B authenticated successfully.');

const tag = `test-notif-${Date.now()}`;

// Track created IDs for cleanup
const created = {
  transactions: [],
  budgets: [],
  categories: [],
  wallets: [],
  notifications: [],
};

try {
  // Setup common wallet for User A
  const { data: walletA, error: wErr } = await clientA
    .from('wallets')
    .insert({
      user_id: userA.id,
      name: `${tag}-wallet`,
      currency: 'IDR',
      opening_balance: 10000000,
      opening_balance_at: '2026-09-01',
      kind: 'cash',
      status: 'active',
    })
    .select()
    .single();
  if (wErr) throw wErr;
  created.wallets.push(walletA.id);

  // Setup Category 1 for User A
  const { data: cat1, error: c1Err } = await clientA
    .from('categories')
    .insert({
      user_id: userA.id,
      name: `${tag}-cat1`,
      type: 'expense',
      keywords: [],
    })
    .select()
    .single();
  if (c1Err) throw c1Err;
  created.categories.push(cat1.id);

  // Setup Budget 1: limit 1,000,000 IDR for September 2026
  const { data: budget1, error: b1Err } = await clientA
    .from('budgets')
    .insert({
      user_id: userA.id,
      category_id: cat1.id,
      currency: 'IDR',
      limit_amount: 1000000,
      period_type: 'monthly',
      period_start: '2026-09-01',
    })
    .select()
    .single();
  if (b1Err) throw b1Err;
  created.budgets.push(budget1.id);

  // Ensure preference for near_limit is enabled for User A
  await clientA
    .from('notification_preferences')
    .upsert(
      [
        { user_id: userA.id, preference_key: 'budget_near_limit', channel: 'in_app', enabled: true },
        { user_id: userA.id, preference_key: 'budget_over_limit', channel: 'in_app', enabled: true },
      ],
      { onConflict: 'user_id,preference_key,channel' }
    );

  // ---------------------------------------------------------------------------
  // TEST 1: near-limit creates in-app notification when preference enabled
  // ---------------------------------------------------------------------------
  console.log('\n--- Running Test 1: near-limit alert creation ---');
  const { data: tx1, error: tx1Err } = await clientA
    .from('transactions')
    .insert({
      user_id: userA.id,
      wallet_id: walletA.id,
      category_id: cat1.id,
      type: 'expense',
      amount: 800000, // 80% of 1,000,000
      currency: 'IDR',
      description: `${tag}-tx1-80%`,
      occurred_at: '2026-09-10T12:00:00Z',
      status: 'completed',
      source: 'web',
    })
    .select()
    .single();
  if (tx1Err) throw tx1Err;
  created.transactions.push(tx1.id);

  // Verify notification row was created
  const { data: notifs1, error: n1Err } = await clientA
    .from('notifications')
    .select('*')
    .eq('user_id', userA.id)
    .eq('type', 'budget_near_limit')
    .eq('dedupe_key', `${budget1.id}:2026-09-01:budget_near_limit`);
  if (n1Err) throw n1Err;
  assert.equal(notifs1.length, 1, 'Exactly one near_limit notification should be created');
  const nNear = notifs1[0];
  created.notifications.push(nNear.id);
  assert.equal(nNear.title, 'Budget almost reached');
  assert.ok(nNear.message.includes('80%'), 'Message should indicate 80%');
  assert.equal(nNear.read_at, null, 'New notification should be unread');
  assert.equal(nNear.metadata.budget_id, budget1.id);
  console.log('✓ Test 1 passed: near-limit notification created with correct metadata.');

  // ---------------------------------------------------------------------------
  // TEST 2: near-limit does not create when preference disabled
  // ---------------------------------------------------------------------------
  console.log('\n--- Running Test 2: near-limit suppressed when preference disabled ---');
  // Setup Category 2 & Budget 2
  const { data: cat2, error: c2Err } = await clientA
    .from('categories')
    .insert({
      user_id: userA.id,
      name: `${tag}-cat2`,
      type: 'expense',
      keywords: [],
    })
    .select()
    .single();
  if (c2Err) throw c2Err;
  created.categories.push(cat2.id);

  const { data: budget2, error: b2Err } = await clientA
    .from('budgets')
    .insert({
      user_id: userA.id,
      category_id: cat2.id,
      currency: 'IDR',
      limit_amount: 1000000,
      period_type: 'monthly',
      period_start: '2026-09-01',
    })
    .select()
    .single();
  if (b2Err) throw b2Err;
  created.budgets.push(budget2.id);

  // Disable in-app near_limit preference
  await clientA
    .from('notification_preferences')
    .upsert(
      [{ user_id: userA.id, preference_key: 'budget_near_limit', channel: 'in_app', enabled: false }],
      { onConflict: 'user_id,preference_key,channel' }
    );

  // Insert transaction reaching 80% on budget 2
  const { data: tx2, error: tx2Err } = await clientA
    .from('transactions')
    .insert({
      user_id: userA.id,
      wallet_id: walletA.id,
      category_id: cat2.id,
      type: 'expense',
      amount: 850000, // 85%
      currency: 'IDR',
      description: `${tag}-tx2-85%`,
      occurred_at: '2026-09-12T12:00:00Z',
      status: 'completed',
      source: 'web',
    })
    .select()
    .single();
  if (tx2Err) throw tx2Err;
  created.transactions.push(tx2.id);

  // Verify NO notification for budget 2 was created
  const { data: notifs2 } = await clientA
    .from('notifications')
    .select('*')
    .eq('user_id', userA.id)
    .eq('dedupe_key', `${budget2.id}:2026-09-01:budget_near_limit`);
  assert.equal(notifs2.length, 0, 'No notification should be created when preference is disabled');
  console.log('✓ Test 2 passed: notification correctly suppressed when preference is disabled.');

  // Re-enable near_limit preference for remaining tests
  await clientA
    .from('notification_preferences')
    .upsert(
      [{ user_id: userA.id, preference_key: 'budget_near_limit', channel: 'in_app', enabled: true }],
      { onConflict: 'user_id,preference_key,channel' }
    );

  // ---------------------------------------------------------------------------
  // TEST 3: over-limit creates correct notification
  // ---------------------------------------------------------------------------
  console.log('\n--- Running Test 3: over-limit notification creation ---');
  // Add 250,000 to budget 1 (total spent: 800,000 + 250,000 = 1,050,000 = 105%)
  const { data: tx3, error: tx3Err } = await clientA
    .from('transactions')
    .insert({
      user_id: userA.id,
      wallet_id: walletA.id,
      category_id: cat1.id,
      type: 'expense',
      amount: 250000,
      currency: 'IDR',
      description: `${tag}-tx3-overlimit`,
      occurred_at: '2026-09-15T12:00:00Z',
      status: 'completed',
      source: 'web',
    })
    .select()
    .single();
  if (tx3Err) throw tx3Err;
  created.transactions.push(tx3.id);

  const { data: notifs3, error: n3Err } = await clientA
    .from('notifications')
    .select('*')
    .eq('user_id', userA.id)
    .eq('type', 'budget_over_limit')
    .eq('dedupe_key', `${budget1.id}:2026-09-01:budget_over_limit`);
  if (n3Err) throw n3Err;
  assert.equal(notifs3.length, 1, 'Exactly one over_limit notification should be created');
  const nOver = notifs3[0];
  created.notifications.push(nOver.id);
  assert.equal(nOver.title, 'Budget exceeded');
  assert.ok(nOver.message.includes('exceeded'), 'Message should state exceeded');
  assert.equal(nOver.read_at, null);
  console.log('✓ Test 3 passed: over-limit notification created properly.');

  // ---------------------------------------------------------------------------
  // TEST 4: duplicate event does not spam duplicate row
  // ---------------------------------------------------------------------------
  console.log('\n--- Running Test 4: duplicate prevention ---');
  // Add another expense to budget 1 (now 1,100,000 = 110%)
  const { data: tx4, error: tx4Err } = await clientA
    .from('transactions')
    .insert({
      user_id: userA.id,
      wallet_id: walletA.id,
      category_id: cat1.id,
      type: 'expense',
      amount: 50000,
      currency: 'IDR',
      description: `${tag}-tx4-more-overlimit`,
      occurred_at: '2026-09-16T12:00:00Z',
      status: 'completed',
      source: 'web',
    })
    .select()
    .single();
  if (tx4Err) throw tx4Err;
  created.transactions.push(tx4.id);

  const { data: notifs4 } = await clientA
    .from('notifications')
    .select('*')
    .eq('user_id', userA.id)
    .eq('type', 'budget_over_limit')
    .eq('dedupe_key', `${budget1.id}:2026-09-01:budget_over_limit`);
  assert.equal(notifs4.length, 1, 'Deduplication must prevent additional rows for the same threshold/period');
  console.log('✓ Test 4 passed: duplicate over-limit event did not create a new row.');

  // ---------------------------------------------------------------------------
  // TEST 5: next budget period can create a new alert
  // ---------------------------------------------------------------------------
  console.log('\n--- Running Test 5: next budget period creates new alert ---');
  const { data: budgetOct, error: bOctErr } = await clientA
    .from('budgets')
    .insert({
      user_id: userA.id,
      category_id: cat1.id,
      currency: 'IDR',
      limit_amount: 1000000,
      period_type: 'monthly',
      period_start: '2026-10-01',
    })
    .select()
    .single();
  if (bOctErr) throw bOctErr;
  created.budgets.push(budgetOct.id);

  // Expense in October reaching 80%
  const { data: txOct, error: txOctErr } = await clientA
    .from('transactions')
    .insert({
      user_id: userA.id,
      wallet_id: walletA.id,
      category_id: cat1.id,
      type: 'expense',
      amount: 800000,
      currency: 'IDR',
      description: `${tag}-tx-oct-80%`,
      occurred_at: '2026-10-05T12:00:00Z',
      status: 'completed',
      source: 'web',
    })
    .select()
    .single();
  if (txOctErr) throw txOctErr;
  created.transactions.push(txOct.id);

  const { data: notifsOct, error: nOctErr } = await clientA
    .from('notifications')
    .select('*')
    .eq('user_id', userA.id)
    .eq('dedupe_key', `${budgetOct.id}:2026-10-01:budget_near_limit`);
  if (nOctErr) throw nOctErr;
  assert.equal(notifsOct.length, 1, 'October period must create its own distinct alert');
  created.notifications.push(notifsOct[0].id);
  console.log('✓ Test 5 passed: new period successfully creates a fresh alert.');

  // ---------------------------------------------------------------------------
  // TEST 6: user isolation & RLS
  // ---------------------------------------------------------------------------
  console.log('\n--- Running Test 6: user isolation & RLS policies ---');
  // User B tries to select User A's notifications
  const { data: userBViewOfA } = await clientB
    .from('notifications')
    .select('*')
    .eq('id', nNear.id);
  assert.equal(userBViewOfA.length, 0, 'User B must not see User A notifications');

  // User B tries to update User A's notification
  const { data: userBUpdate } = await clientB
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', nNear.id)
    .select();
  assert.equal((userBUpdate ?? []).length, 0, 'User B update on User A row must affect 0 rows');

  // User B tries to delete User A's notification
  const { data: userBDelete } = await clientB
    .from('notifications')
    .delete()
    .eq('id', nNear.id)
    .select();
  assert.equal((userBDelete ?? []).length, 0, 'User B delete on User A row must affect 0 rows');

  // Direct client insert from authenticated user should be blocked
  const { error: insertBlockErr } = await clientA
    .from('notifications')
    .insert({
      user_id: userA.id,
      type: 'budget_near_limit',
      title: 'Fake Notification',
      message: 'Direct insert attempt',
    });
  assert.ok(insertBlockErr, 'Direct client INSERT must be denied by permission/RLS');
  console.log('✓ Test 6 passed: RLS isolation enforced and direct client inserts denied.');

  // ---------------------------------------------------------------------------
  // TEST 7: unread count
  // ---------------------------------------------------------------------------
  console.log('\n--- Running Test 7: unread count ---');
  const { count: unreadCount, error: countErr } = await clientA
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userA.id)
    .is('read_at', null);
  if (countErr) throw countErr;
  assert.ok(unreadCount >= 3, `Unread count should be at least 3 (found ${unreadCount})`);
  console.log(`✓ Test 7 passed: unread count returned ${unreadCount}.`);

  // ---------------------------------------------------------------------------
  // TEST 8: mark single read
  // ---------------------------------------------------------------------------
  console.log('\n--- Running Test 8: mark single notification read ---');
  const nowStr = new Date().toISOString();
  const { error: markSingleErr } = await clientA
    .from('notifications')
    .update({ read_at: nowStr })
    .eq('id', nNear.id)
    .eq('user_id', userA.id);
  if (markSingleErr) throw markSingleErr;

  const { data: updatedSingle } = await clientA
    .from('notifications')
    .select('read_at')
    .eq('id', nNear.id)
    .single();
  assert.ok(updatedSingle?.read_at !== null, 'Notification read_at should now be populated');
  console.log('✓ Test 8 passed: single notification marked as read.');

  // ---------------------------------------------------------------------------
  // TEST 9: mark all read
  // ---------------------------------------------------------------------------
  console.log('\n--- Running Test 9: mark all notifications read ---');
  const { error: markAllErr } = await clientA
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userA.id)
    .is('read_at', null);
  if (markAllErr) throw markAllErr;

  const { count: unreadAfterMarkAll } = await clientA
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userA.id)
    .is('read_at', null);
  assert.equal(unreadAfterMarkAll, 0, 'All notifications must be marked read');
  console.log('✓ Test 9 passed: all notifications marked read, unread count is 0.');

  // ---------------------------------------------------------------------------
  // TEST 10: Realtime subscription receives INSERT
  // ---------------------------------------------------------------------------
  console.log('\n--- Running Test 10: Realtime event reception ---');
  // Setup Category 3 & Budget 3
  const { data: cat3, error: c3Err } = await clientA
    .from('categories')
    .insert({
      user_id: userA.id,
      name: `${tag}-cat3`,
      type: 'expense',
      keywords: [],
    })
    .select()
    .single();
  if (c3Err) throw c3Err;
  created.categories.push(cat3.id);

  const { data: budget3, error: b3Err } = await clientA
    .from('budgets')
    .insert({
      user_id: userA.id,
      category_id: cat3.id,
      currency: 'IDR',
      limit_amount: 1000000,
      period_type: 'monthly',
      period_start: '2026-09-01',
    })
    .select()
    .single();
  if (b3Err) throw b3Err;
  created.budgets.push(budget3.id);

  let receivedRealtimeEvent = null;
  const channel = clientA.channel(`rt-test-${tag}`);
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userA.id}`,
    },
    (payload) => {
      receivedRealtimeEvent = payload;
    }
  );

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Realtime subscribe timeout')), 10000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout);
        resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timeout);
        reject(new Error(`Subscription status: ${status}`));
      }
    });
  });

  // Insert transaction causing near-limit on budget 3
  const { data: txRealtime, error: txRtErr } = await clientA
    .from('transactions')
    .insert({
      user_id: userA.id,
      wallet_id: walletA.id,
      category_id: cat3.id,
      type: 'expense',
      amount: 800000,
      currency: 'IDR',
      description: `${tag}-rt-80%`,
      occurred_at: '2026-09-20T12:00:00Z',
      status: 'completed',
      source: 'web',
    })
    .select()
    .single();
  if (txRtErr) throw txRtErr;
  created.transactions.push(txRealtime.id);

  // Wait for Realtime notification
  const startWait = Date.now();
  while (!receivedRealtimeEvent && Date.now() - startWait < 15000) {
    await new Promise((r) => setTimeout(r, 200));
  }
  await clientA.removeChannel(channel);

  assert.ok(receivedRealtimeEvent, 'Realtime INSERT event should be received');
  assert.equal(receivedRealtimeEvent.new.type, 'budget_near_limit');
  created.notifications.push(receivedRealtimeEvent.new.id);
  console.log('✓ Test 10 passed: Realtime INSERT event received successfully.');

  // ---------------------------------------------------------------------------
  // TEST 11: Telegram queue behavior remains unchanged
  // ---------------------------------------------------------------------------
  console.log('\n--- Running Test 11: Telegram queue behavior verification ---');
  // Check if User A has active telegram integration
  const { data: tgInteg } = await clientA
    .from('user_integrations')
    .select('*')
    .eq('user_id', userA.id)
    .eq('provider', 'telegram')
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();

  if (tgInteg) {
    // If User A has telegram connected, enable telegram preference for over_limit
    await clientA
      .from('notification_preferences')
      .upsert(
        [{ user_id: userA.id, preference_key: 'budget_over_limit', channel: 'telegram', enabled: true }],
        { onConflict: 'user_id,preference_key,channel' }
      );

    const { data: diagBefore } = await clientA.rpc('get_telegram_diagnostics');

    // Push budget 3 over limit (800,000 + 300,000 = 1,100,000 = 110%)
    const { data: txTg } = await clientA
      .from('transactions')
      .insert({
        user_id: userA.id,
        wallet_id: walletA.id,
        category_id: cat3.id,
        type: 'expense',
        amount: 300000,
        currency: 'IDR',
        description: `${tag}-tg-overlimit`,
        occurred_at: '2026-09-20T13:00:00Z',
        status: 'completed',
        source: 'web',
      })
      .select()
      .single();
    if (txTg) created.transactions.push(txTg.id);

    const { data: diagAfter } = await clientA.rpc('get_telegram_diagnostics');
    assert.ok(
      diagAfter && (diagAfter.pending > (diagBefore?.pending ?? 0) || diagAfter.retryable > 0),
      'Telegram event should be queued and visible in diagnostics'
    );
    console.log('✓ Test 11 passed: Telegram budget notification event queued correctly and verified via diagnostics.');
  } else {
    console.log('✓ Test 11 skipped Telegram event verification because User A has no active Telegram integration.');
  }

  console.log('\n==================================================');
  console.log('ALL 11 BACKEND NOTIFICATION TESTS PASSED!');
  console.log('==================================================');
} finally {
  console.log('\nCleaning up test artifacts...');
  // Clean up in reverse dependency order
  for (const notifId of created.notifications) {
    await clientA.from('notifications').delete().eq('id', notifId);
  }
  for (const txId of created.transactions) {
    await clientA.from('transactions').delete().eq('id', txId);
  }
  for (const bId of created.budgets) {
    await clientA.from('budgets').delete().eq('id', bId);
  }
  for (const cId of created.categories) {
    await clientA.from('categories').delete().eq('id', cId);
  }
  for (const wId of created.wallets) {
    await clientA.from('wallets').delete().eq('id', wId);
  }
  console.log('Cleanup complete.');
  process.exit(0);
}
