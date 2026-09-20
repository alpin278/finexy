import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type TelegramMessage = { text?: string; from?: { id?: number }; chat?: { id?: number } };
type TelegramCallback = { id?: string; data?: string; from?: { id?: number }; message?: { chat?: { id?: number }; message_id?: number } };
type TelegramUpdate = { update_id?: number; message?: TelegramMessage; callback_query?: TelegramCallback };
type FinanceAction = 'menu' | 'wallets' | 'budgets' | 'transactions' | 'recurring';
type FinanceSnapshot = { status?: string; wallets?: Array<{ name: string; currency: string; balance: number | string }>; budgets?: Array<{ category: string; currency: string; spent: number | string; limit: number | string; remaining: number | string; progress: number | string; status: string }>; transactions?: Array<{ type: string; amount: number | string; currency: string; category: string; wallet: string; occurred_at: string }> };

function logFailure(stage: string, error: unknown) {
  const safeError = error instanceof Error ? error : new Error('Unknown runtime error');
  console.error(JSON.stringify({ stage, error_name: safeError.name }));
}

function logDiagnostic(stage: string, details: Record<string, string | number | boolean>) {
  console.info(JSON.stringify({ stage, ...details }));
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
  [{ text: 'Transaksi Rutin', callback_data: 'finexy:recurring' }],
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

async function acknowledgeCallback(botToken: string, callbackId: string | undefined) {
  if (!callbackId) return;
  try { await answerCallback(botToken, callbackId); } catch (error) { logFailure('callback_acknowledgement', error); }
}

async function removeCallbackKeyboard(botToken: string, callback: TelegramCallback | undefined, chatId: string) {
  const messageId = callback?.message?.message_id;
  if (!messageId) return;
  try { await telegramApi(botToken, 'editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }); } catch (error) { logFailure('callback_keyboard_cleanup', error); }
}

function formatMoney(value: number | string, currency: string) {
  const amount = Number(value);
  const digits = currency === 'IDR' ? { minimumFractionDigits: 0, maximumFractionDigits: 2 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', ...digits }).format(Number.isFinite(amount) ? amount : 0).replace(/\u00a0/g, ' ');
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
  return ['menu', 'wallets', 'budgets', 'transactions', 'recurring', 'expense', 'income'].includes(action) ? action as FinanceAction | 'expense' | 'income' : null;
}

type TransactionSession = { status?: string; step?: string; mode?: string; wallet_name?: string; category_name?: string; amount?: string; currency?: string; note?: string; error?: string; wallets?: Array<{id:string;name:string;currency:string}>; categories?: Array<{id:string;name:string}>; transaction_id?: string };
async function transactionSession(db: ReturnType<typeof createClient>, user: string, chat: string, action: string, value?: string) { const { data, error } = await db.rpc('telegram_transaction_session',{p_telegram_user_id:user,p_telegram_chat_id:chat,p_action:action,p_value:value ?? null}); if(error) throw new Error(`Transaction session RPC failed: ${error.message}`); return (data ?? {status:'unlinked'}) as TransactionSession; }
function transactionError(error: string | undefined) { if (!error) return null; if (/nominal/i.test(error)) return 'Nominal tidak valid. Masukkan angka positif, misalnya 50000.'; if (/wallet/i.test(error)) return 'Wallet tidak tersedia. Pilih wallet lain.'; if (/kategori/i.test(error)) return 'Kategori tidak tersedia. Pilih kategori lain.'; if (/konfirmasi/i.test(error)) return 'Konfirmasi sudah diproses atau sesi tidak lagi aktif.'; return 'Data pencatatan tidak dapat digunakan. Silakan coba lagi.'; }
function txMarkup(session: TransactionSession) { if(session.step==='wallet') return {inline_keyboard:[...(session.wallets??[]).map(w=>[{text:`${w.name} (${w.currency})`,callback_data:`tx:w:${w.id}`}]),[{text:'Cancel',callback_data:'tx:cancel'}]]}; if(session.step==='category') return {inline_keyboard:[...(session.categories??[]).map(c=>[{text:c.name,callback_data:`tx:c:${c.id}`}]),[{text:'Kembali',callback_data:'tx:back'},{text:'Cancel',callback_data:'tx:cancel'}]]}; if(session.step==='amount') return {inline_keyboard:[[{text:'Kembali',callback_data:'tx:back'},{text:'Cancel',callback_data:'tx:cancel'}]]}; if(session.step==='note') return {inline_keyboard:[[{text:'Lewati catatan',callback_data:'tx:skip'}],[{text:'Kembali',callback_data:'tx:back'},{text:'Cancel',callback_data:'tx:cancel'}]]}; if(session.step==='confirm') return {inline_keyboard:[[{text:'Confirm',callback_data:'tx:confirm'},{text:'Cancel',callback_data:'tx:cancel'}],[{text:'Kembali',callback_data:'tx:back'}]]}; return menuMarkup; }
function txText(session: TransactionSession) { const safeError=transactionError(session.error); if(safeError) return safeError; if(session.step==='wallet') return `Pilih wallet untuk ${session.mode==='expense'?'pengeluaran':'pemasukan'}.`; if(session.step==='category') return 'Pilih kategori.'; if(session.step==='amount') return `Masukkan nominal positif dalam ${session.currency}. Contoh: 50000.`; if(session.step==='note') return 'Kirim catatan, atau pilih Lewati catatan.'; if(session.step==='confirm') return `Konfirmasi transaksi\n\nTipe: ${session.mode==='expense'?'Pengeluaran':'Pemasukan'}\nWallet: ${session.wallet_name}\nKategori: ${session.category_name}\nJumlah: ${formatMoney(session.amount??'0',session.currency??'USD')}\nMata uang: ${session.currency}\nCatatan: ${session.note||'-'}`; if(session.step==='completed') return `Transaksi berhasil disimpan.\n\nJumlah: ${formatMoney(session.amount??'0',session.currency??'USD')}\nWallet: ${session.wallet_name}\nKategori: ${session.category_name}`; if(session.step==='canceled') return 'Pencatatan dibatalkan. Pilih Menu untuk tindakan lain.'; return 'Sesi pencatatan sudah berakhir. Pilih Pengeluaran atau Pemasukan untuk mulai lagi.'; }
type RecurringSession = { status?:string; step?:string; mode?:string; ref?:string; type?:string; amount?:number|string; currency?:string; wallet?:string; category?:string; frequency?:string; start_date?:string; local_time?:string; next_due?:string; timezone?:string; active?:boolean; note?:string|null; wallets?:Array<{ref:string;name:string;currency:string}>; categories?:Array<{ref:string;name:string}>; rules?:Array<{ref:string;type:string;amount:number|string;currency:string;wallet:string;category:string;frequency:string;next_due:string;active:boolean}>; error?:string };
async function recurringSession(db: ReturnType<typeof createClient>, user:string, chat:string, action:string, value?:string) {
  logDiagnostic('recurring_session_init', { action, result: 'started' });
  const {data,error}=await db.rpc('telegram_recurring_session',{p_telegram_user_id:user,p_telegram_chat_id:chat,p_action:action,p_value:value??null});
  if(error) {
    logDiagnostic('recurring_session_init', { action, result: 'failed' });
    if (action === 'list') logDiagnostic('recurring_list_load', { result: 'failed', rules_count: 0 });
    throw new Error(`Recurring RPC failed: ${error.message}`);
  }
  const session = (data??{status:'unlinked'}) as RecurringSession;
  logDiagnostic('recurring_session_init', { action, result: session.status === 'linked' ? 'linked' : 'unlinked', step: session.step ?? 'none' });
  if (action === 'list') logDiagnostic('recurring_list_load', { result: session.status === 'linked' ? 'loaded' : 'unlinked', rules_count: session.rules?.length ?? 0 });
  return session;
}
async function replyRecurring(botToken: string, chatId: string, session: RecurringSession) {
  const markup = recurringMarkup(session);
  if (session.step === 'list') {
    const lastRow = markup.inline_keyboard[markup.inline_keyboard.length - 1];
    if (lastRow?.[0]) lastRow[0].text = 'Kembali';
  }
  logDiagnostic('telegram_reply', { flow: 'recurring', result: 'started', step: session.step ?? 'none', rules_count: session.rules?.length ?? 0 });
  try {
    await reply(botToken, chatId, recurringText(session), markup);
    logDiagnostic('telegram_reply', { flow: 'recurring', result: 'sent', step: session.step ?? 'none', rules_count: session.rules?.length ?? 0 });
  } catch (error) {
    logFailure('telegram_reply', error);
    throw error;
  }
}
function recurringMarkup(s:RecurringSession){if(s.step==='list')return{inline_keyboard:[[{text:'Buat Pengeluaran Rutin',callback_data:'rr:new:expense'},{text:'Buat Pemasukan Rutin',callback_data:'rr:new:income'}],...(s.rules??[]).map(r=>[{text:`${r.type==='expense'?'Pengeluaran':'Pemasukan'} ${formatMoney(r.amount,r.currency)} Ã‚· ${r.active?'Aktif':'Jeda'}`,callback_data:`rr:d:${r.ref}`}]),[{text:'Menu',callback_data:'finexy:menu'}]]};if(s.step==='detail')return{inline_keyboard:[[{text:s.active?'Pause':'Resume',callback_data:`rr:t:${s.ref}`},{text:'Edit',callback_data:`rr:e:${s.ref}`}],[{text:'Archive',callback_data:`rr:a:${s.ref}`}],[{text:'Kembali',callback_data:'finexy:recurring'}]]};if(s.step==='archive_confirm')return{inline_keyboard:[[{text:'Archive',callback_data:`rr:x:${s.ref}`},{text:'Batal',callback_data:'finexy:recurring'}]]};if(s.step==='wallet')return{inline_keyboard:[...(s.wallets??[]).map(w=>[{text:`${w.name} (${w.currency})`,callback_data:`rr:w:${w.ref}`}]),[{text:'Kembali',callback_data:'rr:back'},{text:'Batal',callback_data:'rr:cancel'}]]};if(s.step==='category')return{inline_keyboard:[...(s.categories??[]).map(c=>[{text:c.name,callback_data:`rr:c:${c.ref}`}]),[{text:'Kembali',callback_data:'rr:back'},{text:'Batal',callback_data:'rr:cancel'}]]};if(s.step==='frequency')return{inline_keyboard:[[{text:'Mingguan',callback_data:'rr:f:weekly'},{text:'Bulanan',callback_data:'rr:f:monthly'}],[{text:'Kembali',callback_data:'rr:back'},{text:'Batal',callback_data:'rr:cancel'}]]};if(s.step==='schedule_day'){if(s.frequency==='weekly')return{inline_keyboard:[['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d,i)=>({text:d,callback_data:'rr:y:'+String(i+1)})),[{text:'Kembali',callback_data:'rr:back'},{text:'Batal',callback_data:'rr:cancel'}]]};return{inline_keyboard:[Array.from({length:31},(_,i)=>({text:String(i+1),callback_data:'rr:m:'+String(i+1)})),[{text:'Kembali',callback_data:'rr:back'},{text:'Batal',callback_data:'rr:cancel'}]]};}if(s.step==='schedule_time'||s.step==='amount'||s.step==='note')return{inline_keyboard:[...(s.step==='note'?[{text:'Lewati catatan',callback_data:'rr:skip'}]:[]),[{text:'Kembali',callback_data:'rr:back'},{text:'Batal',callback_data:'rr:cancel'}]]};if(s.step==='edit_field')return{inline_keyboard:[['wallet','category','amount'].map(x=>({text:x==='wallet'?'Wallet':x==='category'?'Kategori':'Jumlah',callback_data:`rr:field:${x}`})),[{text:'Frekuensi',callback_data:'rr:field:frequency'},{text:'Jadwal',callback_data:'rr:field:schedule'}],[{text:'Catatan',callback_data:'rr:field:note'},{text:'Review',callback_data:'rr:review'}],[{text:'Batal',callback_data:'rr:cancel'}]]};if(s.step==='confirm')return{inline_keyboard:[[{text:'Confirm',callback_data:'rr:confirm'},{text:'Batal',callback_data:'rr:cancel'}],[{text:'Kembali',callback_data:'rr:back'}]]};return backMarkup;}
function recurringText(s:RecurringSession){if(s.status!=='linked')return'Akun Telegram ini belum terhubung ke Finexy.';if(s.step==='list')return(s.rules??[]).length?`Transaksi Rutin\n\n${(s.rules??[]).map(r=>`${r.type==='expense'?'Pengeluaran':'Pemasukan'}: ${formatMoney(r.amount,r.currency)}\n${r.wallet} | ${r.category}\n${r.frequency} Ã‚· ${new Date(r.next_due).toLocaleString('id-ID',{timeZone:'UTC'})} Ã‚· ${r.active?'Aktif':'Jeda'}`).join('\n\n')}`:'Transaksi Rutin\n\nBelum ada jadwal rutin.';if(s.step==='detail')return`${s.type==='expense'?'Pengeluaran':'Pemasukan'} rutin\n\nJumlah: ${formatMoney(s.amount??0,s.currency??'USD')}\nWallet: ${s.wallet}\nKategori: ${s.category}\nFrekuensi: ${s.frequency}\nBerikutnya: ${s.next_due}\nZona waktu: ${s.timezone}\nStatus: ${s.active?'Aktif':'Jeda'}${s.note?`\nCatatan: ${s.note}`:''}`;if(s.step==='wallet')return'Pilih wallet aktif.';if(s.step==='category')return'Pilih kategori yang sesuai.';if(s.step==='amount')return`Masukkan nominal positif dalam ${s.currency??'mata uang wallet'} (maksimal 4 desimal).`;if(s.step==='frequency')return'Pilih frekuensi.';if(s.step==='schedule_day')return s.frequency==='weekly'?'Pilih hari dalam minggu.':'Pilih tanggal 1 sampai 31.';if(s.step==='schedule_time')return'Kirim waktu lokal dengan format HH:MM.';if(s.step==='note')return'Kirim catatan, atau pilih Lewati catatan.';if(s.step==='edit_field')return'Pilih field yang ingin diubah, atau Review.';if(s.step==='confirm')return`Konfirmasi ${s.mode==='edit'?'perubahan':'jadwal rutin'}\n\nTipe: ${s.type==='expense'?'Pengeluaran':'Pemasukan'}\nWallet: ${s.wallet}\nKategori: ${s.category}\nJumlah: ${formatMoney(s.amount??0,s.currency??'USD')}\nFrekuensi: ${s.frequency}\nJadwal: ${s.start_date} ${s.local_time}\nZona waktu: ${s.timezone}\nCatatan: ${s.note||'-'}`;if(s.step==='completed')return`${s.mode==='edit'?'Perubahan':'Jadwal'} berhasil disimpan.`;if(s.step==='archive_confirm')return'Archive jadwal rutin ini? Transaksi yang sudah dibuat tidak akan dihapus.';if(s.step==='archived')return'Jadwal rutin diarsipkan.';return s.error??'Sesi rutin sudah berakhir.';}function isMenuCommand(text: string) { return /^\/(?:start|menu)(?:@\w+)?\s*$/.test(text); }
function successMarkup(mode: string | undefined) { return {inline_keyboard:[[{text:'Tambah Lagi',callback_data:mode==='expense'?'finexy:expense':'finexy:income'},{text:'Menu',callback_data:'finexy:menu'}]]}; }
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
    const isRecurringMenuCallback = callback?.data === 'finexy:recurring';
    if (isRecurringMenuCallback) logDiagnostic('recurring_menu_callback', { result: 'received', callback_route: 'finexy:recurring' });

    // Acknowledge before database work so inline buttons never appear stuck.
    await acknowledgeCallback(botToken, callback?.id);
    if (callback) await removeCallbackKeyboard(botToken, callback, telegramChatId);

    const linkMatch = /^\/link\s+([A-Fa-f0-9]{12})\s*$/.exec(text);

    if (linkMatch) {
      stage = 'link_rpc';
      const { data: result, error } = await db.rpc('consume_telegram_link_code', { p_telegram_user_id: telegramUserId, p_telegram_chat_id: telegramChatId, p_code: linkMatch[1].toUpperCase(), p_update_id: updateId });
      if (error) throw new Error(`Link RPC failed: ${error.message}`);
      if (result === 'duplicate') return new Response('ok');
      stage = 'link_reply';
      if (result === 'linked') await reply(botToken, telegramChatId, 'Akun Finexy berhasil terhubung. Ketik /menu untuk mulai.');
      else if (result === 'already_linked' || result === 'account_already_linked') await reply(botToken, telegramChatId, 'Akun Telegram ini sudah terhubung. Ketik /menu untuk membuka Finexy.');
      else await reply(botToken, telegramChatId, 'Kode link tidak valid, kedaluwarsa, atau sudah digunakan.');
      return new Response('ok');
    }

    stage = 'update_claim';
    const { data: claim, error } = await db.rpc('claim_telegram_update', { p_telegram_user_id: telegramUserId, p_update_id: updateId, p_event_type: callback ? 'menu_callback' : isMenuCommand(text) ? 'menu_command' : 'command' });
    if (error) throw new Error(`Update claim RPC failed: ${error.message}`);
    if (claim === 'duplicate') {
      if (isRecurringMenuCallback) {
        logDiagnostic('recurring_menu_callback', { result: 'duplicate_retry', callback_route: 'finexy:recurring' });
        const retrySession = await recurringSession(db, telegramUserId, telegramChatId, 'list');
        await replyRecurring(botToken, telegramChatId, retrySession);
        return new Response('ok');
      }
      if (callback?.data === 'tx:confirm') { stage = 'telegram_reply'; await reply(botToken, telegramChatId, 'Konfirmasi sudah diproses. Periksa Transaksi Terakhir untuk hasilnya.', backMarkup); }
      return new Response('ok');
    }

    const requested = callback ? callbackAction(callback.data) : isMenuCommand(text) ? 'menu' : null;
    if (isRecurringMenuCallback) logDiagnostic('recurring_menu_callback', { result: requested === 'recurring' ? 'matched' : 'unmatched', callback_route: requested ?? 'none' });
    const txData = callback?.data;
    let session: TransactionSession | null = null; let recurring: RecurringSession | null = null;
    if (claim === 'claimed') {
      if (requested === 'recurring') recurring = await recurringSession(db, telegramUserId, telegramChatId, 'list'); else if (txData?.startsWith('rr:')) { const [,kind,ref] = txData.split(':'); const map:any={d:'detail',t:'toggle',a:'archive_request',x:'archive_confirm',e:'edit',new:ref==='expense'?'start_expense':'start_income',w:'wallet',c:'category',f:'frequency',y:'weekday',m:'monthday',field:'edit_field',review:'review',confirm:'confirm',cancel:'cancel',back:'back',skip:'skip_note'}; const action=map[kind]??'state'; recurring=await recurringSession(db,telegramUserId,telegramChatId,action,kind==='new'?null:ref); } else if (requested === 'menu') { await transactionSession(db, telegramUserId, telegramChatId, 'cancel'); } else if (requested === 'expense' || requested === 'income') session = await transactionSession(db, telegramUserId, telegramChatId, requested === 'expense' ? 'start_expense' : 'start_income');
      else if (txData?.startsWith('tx:w:')) session = await transactionSession(db, telegramUserId, telegramChatId, 'wallet', txData.slice(5));
      else if (txData?.startsWith('tx:c:')) session = await transactionSession(db, telegramUserId, telegramChatId, 'category', txData.slice(5));
      else if (txData === 'tx:skip') session = await transactionSession(db, telegramUserId, telegramChatId, 'skip_note');
      else if (txData === 'tx:confirm') { stage = 'confirm_callback'; console.info(JSON.stringify({ stage })); try { stage = 'session_load'; console.info(JSON.stringify({ stage })); stage = 'transaction_create'; console.info(JSON.stringify({ stage })); session = await transactionSession(db, telegramUserId, telegramChatId, 'confirm'); stage = session.step === 'completed' ? 'session_complete' : 'transaction_result'; console.info(JSON.stringify({ stage, result: session.step === 'completed' ? 'completed' : 'not_completed' })); } catch (confirmError) { logFailure(stage, confirmError); stage = 'telegram_reply'; await reply(botToken, telegramChatId, 'Transaksi belum dapat disimpan. Periksa data lalu coba Confirm lagi.'); return new Response('ok'); } }
      else if (txData === 'tx:cancel') session = await transactionSession(db, telegramUserId, telegramChatId, 'cancel');
      else if (txData === 'tx:back') session = await transactionSession(db, telegramUserId, telegramChatId, 'back');
      else if (!callback && !requested && text) { const rs = await recurringSession(db, telegramUserId, telegramChatId, 'state'); if (rs.status === 'linked' && ['amount','schedule_time','note'].includes(rs.step??'')) recurring = await recurringSession(db, telegramUserId, telegramChatId, rs.step === 'schedule_time' ? 'time' : rs.step!, text); else { const state = await transactionSession(db, telegramUserId, telegramChatId, 'state'); if (state.step === 'amount' || state.step === 'note') session = await transactionSession(db, telegramUserId, telegramChatId, state.step, text); else if (state.status !== 'linked') session = state; } }
    }
    if (recurring) { await replyRecurring(botToken, telegramChatId, recurring); return new Response('ok'); }
    if (session) { if (session.status !== 'linked') await reply(botToken, telegramChatId, 'Akun Telegram ini belum terhubung ke Finexy.'); else if (session.step === 'completed') { stage = 'telegram_reply'; console.info(JSON.stringify({ stage, result: 'success' })); await reply(botToken, telegramChatId, txText(session), successMarkup(session.mode)); } else await reply(botToken, telegramChatId, txText(session), txMarkup(session)); return new Response('ok'); }
    if (!requested || claim !== 'claimed') { await reply(botToken, telegramChatId, 'Pesan belum dikenali. Ketik /menu untuk membuka menu Finexy.'); return new Response('ok'); }

    stage = 'finance_authorization';
    const action: FinanceAction = requested === 'expense' || requested === 'income' ? 'menu' : requested;
    const snapshot = await financeSnapshot(db, telegramUserId, telegramChatId, action);
    if (callback?.id) await answerCallback(botToken, callback.id);
    if (snapshot.status !== 'linked') { await reply(botToken, telegramChatId, 'Akun Telegram ini belum terhubung ke Finexy.'); return new Response('ok'); }
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
