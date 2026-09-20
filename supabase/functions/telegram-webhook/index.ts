import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type TelegramMessage = { text?: string; from?: { id?: number }; chat?: { id?: number } };
type TelegramCallback = { id?: string; data?: string; from?: { id?: number }; message?: { chat?: { id?: number } } };
type TelegramUpdate = { update_id?: number; message?: TelegramMessage; callback_query?: TelegramCallback };
type FinanceAction = 'menu' | 'wallets' | 'budgets' | 'transactions';
type FinanceSnapshot = { status?: string; wallets?: Array<{ name: string; currency: string; balance: number | string }>; budgets?: Array<{ category: string; currency: string; spent: number | string; limit: number | string; remaining: number | string; progress: number | string; status: string }>; transactions?: Array<{ type: string; amount: number | string; currency: string; category: string; wallet: string; occurred_at: string }> };

function logFailure(stage: string, error: unknown) {
  const safeError = error instanceof Error ? error : new Error('Unknown runtime error');
  console.error(JSON.stringify({ stage, error_name: safeError.name, error_message: safeError.message }));
}

function runtimeConfig() {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const webhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!botToken || !webhookSecret || !supabaseUrl || !serviceRoleKey) throw new Error('Required webhook environment is missing.');
  return { botToken, webhookSecret, supabaseUrl, serviceRoleKey };
}

const menuMarkup = { inline_keyboard: [
  [{ text: 'Pengeluaran', callback_data: 'finexy:expense' }, { text: 'Pemasukan', callback_data: 'finexy:income' }],
  [{ text: 'Saldo', callback_data: 'finexy:wallets' }, { text: 'Budget', callback_data: 'finexy:budgets' }],
  [{ text: 'Transaksi Terakhir', callback_data: 'finexy:transactions' }],
] };
const backMarkup = { inline_keyboard: [[{ text: 'Kembali', callback_data: 'finexy:menu' }]] };

async function telegramApi(botToken: string, method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Telegram ${method} returned HTTP ${response.status}.`);
}

async function reply(botToken: string, chatId: string, text: string, replyMarkup?: object) {
  await telegramApi(botToken, 'sendMessage', { chat_id: chatId, text, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) });
}

async function answerCallback(botToken: string, callbackId: string) {
  await telegramApi(botToken, 'answerCallbackQuery', { callback_query_id: callbackId });
}

function formatMoney(value: number | string, currency: string) {
  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value));
}

function formatWallets(snapshot: FinanceSnapshot) {
  const wallets = snapshot.wallets ?? [];
  if (!wallets.length) return 'Saldo\n\nBelum ada wallet aktif.';
  return `Saldo\n\n${wallets.map((wallet) => `${wallet.name}\n${formatMoney(wallet.balance, wallet.currency)}`).join('\n\n')}`;
}

function formatBudgets(snapshot: FinanceSnapshot) {
  const budgets = snapshot.budgets ?? [];
  if (!budgets.length) return 'Budget bulan ini\n\nBelum ada budget aktif.';
  return `Budget bulan ini\n\n${budgets.map((budget) => {
    const progress = Math.round(Number(budget.progress) * 1000) / 10;
    const status = budget.status === 'over_budget' ? 'Melebihi budget' : budget.status === 'near_limit' ? 'Mendekati limit' : 'Aman';
    return `${budget.category}\n${formatMoney(budget.spent, budget.currency)} / ${formatMoney(budget.limit, budget.currency)} (${progress}%)\nSisa: ${formatMoney(budget.remaining, budget.currency)} - ${status}`;
  }).join('\n\n')}`;
}

function formatTransactions(snapshot: FinanceSnapshot) {
  const transactions = snapshot.transactions ?? [];
  if (!transactions.length) return 'Transaksi terakhir\n\nBelum ada transaksi tersimpan.';
  return `Transaksi terakhir\n\n${transactions.map((transaction) => {
    const type = transaction.type === 'income' ? 'Pemasukan' : transaction.type === 'expense' ? 'Pengeluaran' : 'Transfer';
    const date = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(transaction.occurred_at));
    return `${type}: ${formatMoney(transaction.amount, transaction.currency)}\n${transaction.category} | ${transaction.wallet}\n${date}`;
  }).join('\n\n')}`;
}

async function financeSnapshot(db: ReturnType<typeof createClient>, telegramUserId: string, telegramChatId: string, action: FinanceAction) {
  const { data, error } = await db.rpc('get_telegram_finance_snapshot', { p_telegram_user_id: telegramUserId, p_telegram_chat_id: telegramChatId, p_action: action });
  if (error) throw new Error(`Finance RPC failed: ${error.message}`);
  return (data ?? { status: 'unlinked' }) as FinanceSnapshot;
}

function callbackAction(data: string | undefined): FinanceAction | 'expense' | 'income' | null {
  if (!data?.startsWith('finexy:')) return null;
  const action = data.slice('finexy:'.length);
  return ['menu', 'wallets', 'budgets', 'transactions', 'expense', 'income'].includes(action) ? action as FinanceAction | 'expense' | 'income' : null;
}

Deno.serve(async (request) => {
  let stage = 'configuration';
  try {
    const { botToken, webhookSecret, supabaseUrl, serviceRoleKey } = runtimeConfig();
    stage = 'webhook_secret';
    if (request.headers.get('x-telegram-bot-api-secret-token') !== webhookSecret) return new Response('forbidden', { status: 403 });

    stage = 'update_parse';
    let update: TelegramUpdate;
    try { update = await request.json(); } catch { return new Response('bad request', { status: 400 }); }
    const callback = update.callback_query;
    const message = update.message;
    const fromId = callback?.from?.id ?? message?.from?.id;
    const chatId = callback?.message?.chat?.id ?? message?.chat?.id;
    if (!fromId || !chatId || !Number.isInteger(update.update_id)) return new Response('ok');

    const text = (message?.text ?? '').trim();
    const telegramUserId = String(fromId);
    const telegramChatId = String(chatId);
    const updateId = String(update.update_id);
    const db = createClient(supabaseUrl, serviceRoleKey);
    const linkMatch = /^\/link\s+([A-Fa-f0-9]{12})\s*$/.exec(text);

    if (linkMatch) {
      stage = 'link_rpc';
      const { data: result, error } = await db.rpc('consume_telegram_link_code', { p_telegram_user_id: telegramUserId, p_telegram_chat_id: telegramChatId, p_code: linkMatch[1].toUpperCase(), p_update_id: updateId });
      if (error) throw new Error(`Link RPC failed: ${error.message}`);
      if (result === 'duplicate') return new Response('ok');
      stage = 'link_reply';
      if (result === 'linked') await reply(botToken, telegramChatId, 'Akun Finexy berhasil terhubung.');
      else if (result === 'already_linked' || result === 'account_already_linked') await reply(botToken, telegramChatId, 'Akun Telegram ini sudah terhubung.');
      else await reply(botToken, telegramChatId, 'Kode link tidak valid, kedaluwarsa, atau sudah digunakan.');
      return new Response('ok');
    }

    stage = 'update_claim';
    const { data: claim, error } = await db.rpc('claim_telegram_update', { p_telegram_user_id: telegramUserId, p_update_id: updateId, p_event_type: callback ? 'menu_callback' : text.startsWith('/menu') ? 'menu_command' : 'command' });
    if (error) throw new Error(`Update claim RPC failed: ${error.message}`);
    if (claim === 'duplicate') return new Response('ok');

    const requested = callback ? callbackAction(callback.data) : text.startsWith('/menu') ? 'menu' : null;
    if (!requested || claim !== 'claimed') {
      if (callback?.id) await answerCallback(botToken, callback.id);
      await reply(botToken, telegramChatId, text.startsWith('/start') ? 'Selamat datang di Finexy. Hubungkan akun dari Settings terlebih dahulu.' : 'Akun Telegram ini belum terhubung ke Finexy.');
      return new Response('ok');
    }

    stage = 'finance_authorization';
    const action: FinanceAction = requested === 'expense' || requested === 'income' ? 'menu' : requested;
    const snapshot = await financeSnapshot(db, telegramUserId, telegramChatId, action);
    if (callback?.id) await answerCallback(botToken, callback.id);
    if (snapshot.status !== 'linked') {
      await reply(botToken, telegramChatId, 'Akun Telegram ini belum terhubung ke Finexy.');
      return new Response('ok');
    }

    stage = 'finance_reply';
    if (requested === 'menu') await reply(botToken, telegramChatId, 'Menu Finexy', menuMarkup);
    else if (requested === 'wallets') await reply(botToken, telegramChatId, formatWallets(snapshot), backMarkup);
    else if (requested === 'budgets') await reply(botToken, telegramChatId, formatBudgets(snapshot), backMarkup);
    else if (requested === 'transactions') await reply(botToken, telegramChatId, formatTransactions(snapshot), backMarkup);
    else await reply(botToken, telegramChatId, 'Pencatatan transaksi akan tersedia pada fase berikutnya.', backMarkup);
    return new Response('ok');
  } catch (error) {
    logFailure(stage, error);
    return new Response('internal error', { status: 500 });
  }
});
