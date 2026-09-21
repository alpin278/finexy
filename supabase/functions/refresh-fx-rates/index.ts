import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const provider = 'Frankfurter';
const allowed = new Set(['USD', 'EUR', 'GBP', 'IDR']);

function badRequest() { return new Response('invalid FX provider response', { status: 502 }); }

/** Authenticated, rate-cache-only refresh. No financial data is read or changed. */
Deno.serve(async (request) => {
  try {
    if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
    const url = Deno.env.get('SUPABASE_URL'); const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const auth = request.headers.get('authorization');
    if (!url || !serviceKey || !auth) return new Response('unauthorized', { status: 401 });
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? serviceKey, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response('unauthorized', { status: 401 });
    const db = createClient(url, serviceKey);
    // Global cache guard: authenticated callers can request a check, but only
    // one provider fetch per UTC day is permitted by this function.
    const today = new Date().toISOString().slice(0, 10);
    const { data: cached } = await db.from('fx_rates').select('rate_date, fetched_at').eq('base_currency', 'EUR').eq('provider', provider).gte('fetched_at', `${today}T00:00:00.000Z`).limit(1);
    if (cached?.length) return Response.json({ status: 'current', provider, rate_date: cached[0].rate_date });
    const response = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,GBP,IDR');
    if (!response.ok) return new Response('FX provider unavailable', { status: 503 });
    const payload = await response.json() as { base?: unknown; date?: unknown; rates?: Record<string, unknown> };
    if (payload.base !== 'EUR' || typeof payload.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date) || !payload.rates) return badRequest();
    const now = new Date().toISOString();
    const rows = Object.entries(payload.rates).flatMap(([quote, rate]) => {
      const value = typeof rate === 'number' ? rate : Number(rate);
      return allowed.has(quote) && Number.isFinite(value) && value > 0 ? [{ base_currency: 'EUR', quote_currency: quote, rate: String(value), rate_date: payload.date, provider, provider_metadata: { base: 'EUR', publication_date: payload.date }, fetched_at: now }] : [];
    });
    if (rows.length !== 3) return badRequest();
    const { error } = await db.from('fx_rates').upsert(rows, { onConflict: 'base_currency,quote_currency,rate_date,provider' });
    if (error) throw error;
    return Response.json({ status: 'refreshed', provider, rate_date: payload.date, currencies: rows.map((row) => row.quote_currency) });
  } catch (error) {
    console.info(JSON.stringify({ stage: 'fx_refresh_failure', error_class: error instanceof Error ? error.name : 'unknown' }));
    return new Response('FX refresh failed', { status: 500 });
  }
});
