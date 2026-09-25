import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const nonceMetadataKey = 'finexy_verification_watch_nonce';
const watchLifetimeMs = 2 * 60 * 60 * 1000;

type CreateBody = { action: 'create'; user_id: string; nonce: string };
type StatusBody = { action: 'status'; token: string };
type RequestBody = CreateBody | StatusBody;

function response(body: Record<string, string>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
      'access-control-allow-methods': 'POST, OPTIONS',
    },
  });
}

function config() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) throw new Error('Verification watch configuration missing.');
  return { url, serviceRoleKey };
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isOpaqueToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{40,64}$/.test(value);
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  bytes.forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function createWatch(db: ReturnType<typeof createClient>, body: CreateBody) {
  if (!isUuid(body.user_id) || typeof body.nonce !== 'string' || body.nonce.length < 40 || body.nonce.length > 64) {
    return response({ error: 'invalid request' }, 400);
  }

  const { data, error } = await db.auth.admin.getUserById(body.user_id);
  const expectedNonce = data.user?.user_metadata?.[nonceMetadataKey];
  if (error || !data.user || expectedNonce !== body.nonce) {
    return response({ error: 'invalid request' }, 403);
  }

  const token = randomToken();
  const expiresAt = new Date(Date.now() + watchLifetimeMs).toISOString();
  const { error: insertError } = await db.from('email_verification_watches').insert({
    user_id: body.user_id,
    token_hash: await digest(token),
    expires_at: expiresAt,
  });

  if (insertError) return response({ error: 'watch unavailable' }, 500);
  return response({ token, expires_at: expiresAt });
}

async function readStatus(db: ReturnType<typeof createClient>, body: StatusBody) {
  if (!isOpaqueToken(body.token)) return response({ status: 'expired' });

  const { data: watch, error } = await db
    .from('email_verification_watches')
    .select('user_id, expires_at, consumed_at')
    .eq('token_hash', await digest(body.token))
    .maybeSingle();

  if (error) return response({ error: 'watch unavailable' }, 500);
  if (!watch || new Date(watch.expires_at).getTime() <= Date.now()) return response({ status: 'expired' });
  if (watch.consumed_at) return response({ status: 'verified' });

  const { data: user, error: userError } = await db.auth.admin.getUserById(watch.user_id);
  if (userError) return response({ error: 'watch unavailable' }, 500);

  if (user.user?.email_confirmed_at) {
    const { error: consumeError } = await db
      .from('email_verification_watches')
      .update({ consumed_at: new Date().toISOString() })
      .eq('token_hash', await digest(body.token))
      .is('consumed_at', null);
    if (consumeError) return response({ error: 'watch unavailable' }, 500);
    return response({ status: 'verified' });
  }

  return response({ status: 'pending' });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return response({ ok: 'true' });
  if (request.method !== 'POST') return response({ error: 'method not allowed' }, 405);

  try {
    const body = await request.json() as RequestBody;
    const db = createClient(config().url, config().serviceRoleKey);
    if (body.action === 'create') return createWatch(db, body);
    if (body.action === 'status') return readStatus(db, body);
    return response({ error: 'invalid request' }, 400);
  } catch {
    return response({ error: 'invalid request' }, 400);
  }
});
