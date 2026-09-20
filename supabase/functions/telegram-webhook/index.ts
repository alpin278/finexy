import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
const webhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!botToken || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
  throw new Error('Telegram webhook environment is not configured.');
}

const db = createClient(supabaseUrl, serviceRoleKey);

async function reply(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text }) });
}

Deno.serve(async (request) => {
  if (request.headers.get('x-telegram-bot-api-secret-token') !== webhookSecret) return new Response('forbidden', { status: 403 });
  let update: { update_id?: number; message?: { text?: string; from?: { id?: number }; chat?: { id?: number } } };
  try { update = await request.json(); } catch { return new Response('bad request', { status: 400 }); }
  const message = update.message;
  if (!message?.from?.id || !message.chat?.id || !Number.isInteger(update.update_id)) return new Response('ok');
  const text = (message.text ?? '').trim();
  const telegramUserId = String(message.from.id);
  const telegramChatId = String(message.chat.id);
  const updateId = String(update.update_id);
  const linkMatch = /^\/link\s+([A-Fa-f0-9]{12})\s*$/.exec(text);

  if (linkMatch) {
    const { data: result, error } = await db.rpc('consume_telegram_link_code', { p_telegram_user_id: telegramUserId, p_telegram_chat_id: telegramChatId, p_code: linkMatch[1].toUpperCase(), p_update_id: updateId });
    if (error) return new Response('internal error', { status: 500 });
    if (result === 'duplicate') return new Response('ok');
    if (result === 'linked') await reply(telegramChatId, 'Finexy account linked successfully.');
    else if (result === 'already_linked' || result === 'account_already_linked') await reply(telegramChatId, 'This Telegram account is already linked.');
    else await reply(telegramChatId, 'This link code is invalid, expired, or already used.');
    return new Response('ok');
  }

  const { data: claim, error } = await db.rpc('claim_telegram_update', { p_telegram_user_id: telegramUserId, p_update_id: updateId, p_event_type: text.startsWith('/menu') ? 'menu_command' : 'command' });
  if (error) return new Response('internal error', { status: 500 });
  if (claim === 'duplicate') return new Response('ok');
  if (claim !== 'claimed') {
    await reply(telegramChatId, text.startsWith('/start') ? 'Welcome to Finexy. Link your account from Settings first.' : 'This Telegram account is not linked.');
    return new Response('ok');
  }
  if (text.startsWith('/menu')) await reply(telegramChatId, 'Account linked. Financial commands will be available in the next integration phase.');
  else await reply(telegramChatId, 'Finexy is linked. Use /menu for available actions.');
  return new Response('ok');
});
