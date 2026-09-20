import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Notification = { notification_id: string; chat_id: string; threshold: 'budget_near_limit' | 'budget_over_limit'; category: string; spent: number | string; limit: number | string; currency: string; progress: number | string; attempt: number };

function log(stage: string, details: Record<string, unknown> = {}) { console.info(JSON.stringify({ stage, ...details })); }
function config() {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const workerSecret = Deno.env.get('TELEGRAM_NOTIFICATION_WORKER_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!botToken || !workerSecret || !supabaseUrl || !serviceRoleKey) throw new Error('Worker configuration missing.');
  return { botToken, workerSecret, supabaseUrl, serviceRoleKey };
}
function formatMoney(value: number | string, currency: string) { const digits = currency === 'IDR' ? { minimumFractionDigits: 0, maximumFractionDigits: 2 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }; return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', ...digits }).format(Number(value)).replace(/\u00a0/g, ' '); }
function text(event: Notification) { const heading = event.threshold === 'budget_over_limit' ? 'Budget telah melewati batas' : 'Budget hampir mencapai batas'; return `${heading}\n\nKategori: ${event.category}\nTerpakai: ${formatMoney(event.spent, event.currency)} / ${formatMoney(event.limit, event.currency)}\nProgress: ${Math.round(Number(event.progress) * 10) / 10}%`; }
async function send(botToken: string, chatId: string, message: string) { const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: message }) }); if (!response.ok) { const permanent = response.status === 400 || response.status === 403; throw { permanent, classification: permanent ? 'destination_rejected' : 'telegram_temporary_failure' }; } }

Deno.serve(async (request) => {
  try {
    const { botToken, workerSecret, supabaseUrl, serviceRoleKey } = config();
    if (request.headers.get('x-worker-secret') !== workerSecret) return new Response('forbidden', { status: 403 });
    const db = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await db.rpc('claim_telegram_budget_notification_worker');
    if (error) throw error;
    const event = data as Notification | null;
    if (!event?.notification_id || !event.chat_id) return Response.json({ claimed: false });
    try {
      await send(botToken, event.chat_id, text(event));
      const { error: completeError } = await db.rpc('complete_telegram_budget_notification_worker', { p_notification_id: event.notification_id, p_delivered: true, p_retryable: true, p_error_class: null });
      if (completeError) throw completeError;
      log('delivered', { event_type: event.threshold, attempt: event.attempt });
      return Response.json({ delivered: true });
    } catch (error) {
      const safe = error as { permanent?: boolean; classification?: string };
      const { error: completeError } = await db.rpc('complete_telegram_budget_notification_worker', { p_notification_id: event.notification_id, p_delivered: false, p_retryable: !safe.permanent, p_error_class: safe.classification ?? 'delivery_failed' });
      if (completeError) throw completeError;
      log('delivery_failed', { event_type: event.threshold, attempt: event.attempt, error_class: safe.classification ?? 'delivery_failed' });
      return Response.json({ delivered: false });
    }
  } catch (error) {
    log('worker_failure', { error_class: error instanceof Error ? error.name : 'unknown' });
    return new Response('internal error', { status: 500 });
  }
});