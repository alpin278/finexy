import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type TelegramUpdate = {
  update_id?: number;
  message?: { text?: string; from?: { id?: number }; chat?: { id?: number } };
};

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

async function reply(botToken: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!response.ok) throw new Error(`Telegram sendMessage returned HTTP ${response.status}.`);
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
    const message = update.message;
    if (!message?.from?.id || !message.chat?.id || !Number.isInteger(update.update_id)) return new Response('ok');

    const text = (message.text ?? '').trim();
    const telegramUserId = String(message.from.id);
    const telegramChatId = String(message.chat.id);
    const updateId = String(update.update_id);
    const db = createClient(supabaseUrl, serviceRoleKey);
    const linkMatch = /^\/link\s+([A-Fa-f0-9]{12})\s*$/.exec(text);

    if (linkMatch) {
      stage = 'link_rpc';
      const { data: result, error } = await db.rpc('consume_telegram_link_code', { p_telegram_user_id: telegramUserId, p_telegram_chat_id: telegramChatId, p_code: linkMatch[1].toUpperCase(), p_update_id: updateId });
      if (error) throw new Error(`Link RPC failed: ${error.message}`);
      if (result === 'duplicate') return new Response('ok');
      stage = 'link_reply';
      if (result === 'linked') await reply(botToken, telegramChatId, 'Finexy account linked successfully.');
      else if (result === 'already_linked' || result === 'account_already_linked') await reply(botToken, telegramChatId, 'This Telegram account is already linked.');
      else await reply(botToken, telegramChatId, 'This link code is invalid, expired, or already used.');
      return new Response('ok');
    }

    stage = 'update_claim';
    const { data: claim, error } = await db.rpc('claim_telegram_update', { p_telegram_user_id: telegramUserId, p_update_id: updateId, p_event_type: text.startsWith('/menu') ? 'menu_command' : 'command' });
    if (error) throw new Error(`Update claim RPC failed: ${error.message}`);
    if (claim === 'duplicate') return new Response('ok');

    stage = 'command_reply';
    if (claim !== 'claimed') await reply(botToken, telegramChatId, text.startsWith('/start') ? 'Welcome to Finexy. Link your account from Settings first.' : 'This Telegram account is not linked.');
    else if (text.startsWith('/menu')) await reply(botToken, telegramChatId, 'Account linked. Financial commands will be available in the next integration phase.');
    else await reply(botToken, telegramChatId, 'Finexy is linked. Use /menu for available actions.');
    return new Response('ok');
  } catch (error) {
    logFailure(stage, error);
    return new Response('internal error', { status: 500 });
  }
});
