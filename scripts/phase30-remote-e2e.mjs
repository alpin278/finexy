import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function envFile(path) {
  return Object.fromEntries(fs.readFileSync(path, 'utf8').split(/\r?\n/).flatMap((line) => {
    const index = line.indexOf('=');
    if (index <= 0 || line.trim().startsWith('#')) return [];
    const raw = line.slice(index + 1).trim();
    const value = raw.length >= 2 && ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) ? raw.slice(1, -1) : raw;
    return [[line.slice(0, index).trim(), value]];
  }));
}
const env = { ...envFile('.env.local'), ...envFile('.auth-test.local') };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert.ok(url && key && env.QA_USER_A_EMAIL && env.QA_USER_A_PASSWORD && env.QA_USER_B_EMAIL && env.QA_USER_B_PASSWORD, 'QA configuration is incomplete.');
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
async function login(email, password, label) { const api = client(); const { error } = await api.auth.signInWithPassword({ email, password }); if (error) throw new Error(`${label} authentication failed (status ${error.status ?? 'unknown'}, code ${error.code ?? 'unknown'}).`); return api; }
async function one(api, table, fields, filters = []) { let q = api.from(table).select(fields); for (const [op, key, value] of filters) q = op === 'eq' ? q.eq(key, value) : q.in(key, value); const { data, error } = await q; if (error) throw error; return data; }
async function mustFail(work, label) { try { await work(); } catch { return; } throw new Error(`${label} unexpectedly succeeded.`); }
function waitForSubscription(channel) { return new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Realtime subscription timed out.')), 15000); channel.subscribe((status) => { if (status === 'SUBSCRIBED') { clearTimeout(timeout); resolve(); } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(timeout); reject(new Error(`Realtime subscription failed: ${status}.`)); } }); }); }
async function waitFor(work, label) { const deadline = Date.now() + 15000; while (Date.now() < deadline) { if (await work()) return; await new Promise((resolve) => setTimeout(resolve, 100)); } throw new Error(`${label} timed out.`); }

const a = await login(env.QA_USER_A_EMAIL, env.QA_USER_A_PASSWORD, 'QA user A');
const b = await login(env.QA_USER_B_EMAIL, env.QA_USER_B_PASSWORD, 'QA user B');
const { data: { user: userA } } = await a.auth.getUser();
const { data: { user: userB } } = await b.auth.getUser();
assert.ok(userA && userB && userA.id !== userB.id, 'QA users are not distinct.');
const tag = `phase30-${Date.now()}`;
async function insert(api, table, value) { const { data, error } = await api.from(table).insert(value).select().single(); if (error) throw error; return data; }
const wallet = await insert(a, 'wallets', { user_id: userA.id, name: `${tag}-wallet`, currency: 'IDR', opening_balance: 1000000, opening_balance_at: '2026-09-01', kind: 'bank', status: 'active' });
const food = await insert(a, 'categories', { user_id: userA.id, name: `${tag}-food`, type: 'expense', keywords: [] });
const care = await insert(a, 'categories', { user_id: userA.id, name: `${tag}-care`, type: 'expense', keywords: [] });
const home = await insert(a, 'categories', { user_id: userA.id, name: `${tag}-home`, type: 'expense', keywords: [] });
const normal = await insert(a, 'transactions', { user_id: userA.id, wallet_id: wallet.id, category_id: food.id, type: 'expense', amount: 10000, currency: 'IDR', description: `${tag}-normal`, occurred_at: '2026-09-21T00:00:00Z', status: 'completed', source: 'web' });
const save = async (amount, splits, id = null) => {
  const { data, error } = await a.rpc('save_transaction_with_splits', { p_transaction_id: id, p_wallet_id: wallet.id, p_type: 'expense', p_amount: amount, p_currency: 'IDR', p_payee: null, p_description: `${tag}-split`, p_note: null, p_occurred_at: '2026-09-21T00:00:00Z', p_status: 'completed', p_reference: null, p_splits: splits });
  if (error) throw error; return data;
};
const base = [{ category_id: food.id, amount: 180000, note: null }, { category_id: care.id, amount: 50000, note: null }, { category_id: home.id, amount: 20000, note: null }];
let splitRealtimeEvents = 0;
const realtimeChannel = a.channel(`phase30-splits-${tag}`).on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_splits', filter: `user_id=eq.${userA.id}` }, () => { splitRealtimeEvents += 1; });
await waitForSubscription(realtimeChannel);
const splitId = await save(250000, base);
let splits = await one(a, 'transaction_splits', 'id,transaction_id,category_id,amount', [['eq', 'transaction_id', splitId]]);
assert.equal(splits.length, 3); assert.equal(splits.reduce((n, s) => n + Number(s.amount), 0), 250000);
await waitFor(() => Promise.resolve(splitRealtimeEvents >= 3), 'Realtime split inserts');
const beforeRejected = splits.length;
await mustFail(() => save(250000, [{ category_id: food.id, amount: 180000 }, { category_id: care.id, amount: 50000 }, { category_id: home.id, amount: 10000 }]), 'wrong total');
await mustFail(() => save(250000, [{ category_id: food.id, amount: 180000 }, { category_id: care.id, amount: 50000 }, { category_id: home.id, amount: 30000 }]), 'over total');
await mustFail(() => save(250000, [{ category_id: food.id, amount: 250000 }, { category_id: care.id, amount: 0 }]), 'zero allocation');
await mustFail(() => save(250000, [{ category_id: food.id, amount: 250001 }, { category_id: care.id, amount: -1 }]), 'negative allocation');
assert.equal((await one(a, 'transaction_splits', 'id', [['eq', 'transaction_id', splitId]])).length, beforeRejected, 'rejections changed existing allocations');
assert.equal((await one(b, 'transaction_splits', 'id', [['eq', 'id', splits[0].id]])).length, 0, 'User B can read User A split');
await mustFail(() => b.from('transaction_splits').insert({ user_id: userB.id, transaction_id: splitId, category_id: food.id, amount: 1 }).then(({ error }) => { if (error) throw error; }), 'foreign parent insert');
await mustFail(() => b.from('transaction_splits').update({ amount: 1 }).eq('id', splits[0].id).select().then(({ error, data }) => { if (error || !data?.length) throw error ?? new Error(); }), 'foreign update');
await mustFail(() => b.from('transaction_splits').delete().eq('id', splits[0].id).select().then(({ error, data }) => { if (error || !data?.length) throw error ?? new Error(); }), 'foreign delete');
const realtimeEventsBeforeRedistribution = splitRealtimeEvents;
await save(250000, [{ category_id: food.id, amount: 150000 }, { category_id: care.id, amount: 80000 }, { category_id: home.id, amount: 20000 }], splitId);
splits = await one(a, 'transaction_splits', 'category_id,amount', [['eq', 'transaction_id', splitId]]);
assert.deepEqual(splits.map((s) => Number(s.amount)).sort((x, y) => x - y), [20000, 80000, 150000]);
await waitFor(() => Promise.resolve(splitRealtimeEvents > realtimeEventsBeforeRedistribution), 'Realtime split redistribution');
await save(300000, [{ category_id: food.id, amount: 180000 }, { category_id: care.id, amount: 100000 }, { category_id: home.id, amount: 20000 }], splitId);
const parent = (await one(a, 'transactions', 'amount', [['eq', 'id', splitId]]))[0]; assert.equal(Number(parent.amount), 300000);
const walletRows = await one(a, 'wallets', 'opening_balance', [['eq', 'id', wallet.id]]); assert.equal(Number(walletRows[0].opening_balance), 1000000, 'splits altered wallet opening balance');
const { data: exportedBackup, error: exportError } = await a.rpc('finexy_export_backup'); if (exportError) throw exportError;
const backup = structuredClone(exportedBackup);
backup.wallets = backup.wallets.filter((wallet) => wallet.name === `${tag}-wallet`);
backup.categories = backup.categories.filter((category) => [`${tag}-food`, `${tag}-care`, `${tag}-home`].includes(category.name));
backup.category_rules = [];
backup.transactions = backup.transactions.filter((transaction) => transaction.description === `${tag}-split`);
backup.transaction_splits = backup.transaction_splits.filter((split) => backup.transactions.some((transaction) => transaction.ref === split.transaction_ref));
backup.wallet_transfers = [];
backup.budgets = [];
backup.recurring_rules = [];
assert.equal(backup.version, 2, 'backup version is not v2');
const backupParent = backup.transactions.find((transaction) => transaction.description === `${tag}-split`);
assert.ok(backupParent, 'backup omitted split parent');
const backupSplits = backup.transaction_splits.filter((split) => split.transaction_ref === backupParent.ref);
assert.equal(backupSplits.length, 3, 'backup omitted split allocations');
const { data: importSummary, error: importError } = await b.rpc('finexy_import_backup', { p_backup: backup, p_mode: 'merge' }); if (importError) throw importError;
assert.equal(importSummary.version, 2, 'v2 backup import did not report version 2');
const importedParent = (await one(b, 'transactions', 'id,amount', [['eq', 'description', `${tag}-split`]]))[0];
assert.ok(importedParent, 'User B backup import omitted split parent');
const importedSplits = await one(b, 'transaction_splits', 'amount', [['eq', 'transaction_id', importedParent.id]]);
assert.equal(importedSplits.length, 3, 'User B backup import omitted split rows');
assert.equal(importedSplits.reduce((total, split) => total + Number(split.amount), 0), Number(importedParent.amount), 'backup round-trip changed split total');
await a.removeChannel(realtimeChannel);
// Normal -> split -> normal is represented by deleting allocations before the normal parent edit.
const { error: clearError } = await a.from('transaction_splits').delete().eq('transaction_id', splitId); if (clearError) throw clearError;
const { error: normalEditError } = await a.from('transactions').update({ category_id: food.id, amount: 300000 }).eq('id', splitId); if (normalEditError) throw normalEditError;
assert.equal((await one(a, 'transaction_splits', 'id', [['eq', 'transaction_id', splitId]])).length, 0, 'normal conversion retained splits');
await a.from('transactions').update({ deleted_at: new Date().toISOString() }).in('id', [normal.id, splitId]);
console.log('phase30 remote E2E: authenticated RLS, split integrity, backup round-trip, Realtime, redistribution, parent edit, and normal conversion passed');
process.exit(0);
