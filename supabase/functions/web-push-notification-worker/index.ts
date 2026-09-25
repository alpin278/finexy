import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { send } from '@daaku/webpush';

type Delivery = {
  outbox_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
};

type WorkerConfig = {
  workerSecret: string;
  vapidSubject: string;
  vapidPrivateKey: JsonWebKey;
  supabaseUrl: string;
  serviceRoleKey: string;
};

const MAX_DELIVERIES_PER_RUN = 20;

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64Url(value: Uint8Array) {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function runtimeConfig(): WorkerConfig {
  const values = {
    workerSecret: Deno.env.get('WEB_PUSH_WORKER_SECRET'),
    vapidPublicKey: Deno.env.get('WEB_PUSH_VAPID_PUBLIC_KEY'),
    vapidPrivateKey: Deno.env.get('WEB_PUSH_VAPID_PRIVATE_KEY'),
    vapidSubject: Deno.env.get('WEB_PUSH_VAPID_SUBJECT'),
    supabaseUrl: Deno.env.get('SUPABASE_URL'),
    serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  };

  if (Object.values(values).some((value) => !value)) throw new Error('Web Push worker configuration missing.');

  const publicKey = decodeBase64Url(values.vapidPublicKey!);
  const privateKey = decodeBase64Url(values.vapidPrivateKey!);
  if (publicKey.length !== 65 || publicKey[0] !== 4 || privateKey.length !== 32) {
    throw new Error('Web Push VAPID keys are invalid.');
  }

  return {
    workerSecret: values.workerSecret!,
    vapidSubject: values.vapidSubject!,
    vapidPrivateKey: {
      kty: 'EC',
      crv: 'P-256',
      x: encodeBase64Url(publicKey.slice(1, 33)),
      y: encodeBase64Url(publicKey.slice(33, 65)),
      d: encodeBase64Url(privateKey),
      ext: true,
    },
    supabaseUrl: values.supabaseUrl!,
    serviceRoleKey: values.serviceRoleKey!,
  };
}

function statusCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const value = (error as { statusCode?: unknown }).statusCode;
  return typeof value === 'number' ? value : null;
}

function isTrustedPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    return host === 'fcm.googleapis.com'
      || host.endsWith('.fcm.googleapis.com')
      || host === 'push.services.mozilla.com'
      || host.endsWith('.push.services.mozilla.com')
      || host === 'push.apple.com'
      || host.endsWith('.push.apple.com')
      || host === 'notify.windows.com'
      || host.endsWith('.notify.windows.com');
  } catch {
    return false;
  }
}

function failureDetails(error: unknown) {
  const status = statusCode(error);
  if (status === 404 || status === 410) return { retryable: false, deactivate: true, errorClass: 'subscription_gone' };
  if (status === 400) return { retryable: false, deactivate: true, errorClass: 'invalid_subscription' };
  if (status === 401 || status === 403) return { retryable: false, deactivate: true, errorClass: 'vapid_rejected' };
  if (status === 429) return { retryable: true, deactivate: false, errorClass: 'push_service_rate_limited' };
  if (status !== null && status >= 500) return { retryable: true, deactivate: false, errorClass: 'push_service_unavailable' };
  return { retryable: true, deactivate: false, errorClass: 'push_delivery_failed' };
}

async function processDelivery(db: SupabaseClient<any>, delivery: Delivery, config: WorkerConfig) {
  try {
    if (!isTrustedPushEndpoint(delivery.endpoint)) {
      throw Object.assign(new Error('Invalid push endpoint.'), { statusCode: 400 });
    }

    await send(
      {
        endpoint: delivery.endpoint,
        keys: { p256dh: delivery.p256dh_key, auth: delivery.auth_key },
      },
      JSON.stringify({
        title: 'Finexy',
        body: 'You have a new Finexy notification.',
        data: { route: '/overview' },
      }),
      {
        vapid: config.vapidPrivateKey,
        subscriber: config.vapidSubject,
        ttl: 60,
        urgency: 'normal',
      }
    );

    const { error } = await db.rpc('complete_web_push_notification', {
      p_outbox_id: delivery.outbox_id,
      p_delivered: true,
      p_retryable: false,
      p_error_class: null,
      p_deactivate_subscription: false,
    });
    if (error) throw error;
    return 'delivered' as const;
  } catch (error) {
    const details = failureDetails(error);
    const { error: completionError } = await db.rpc('complete_web_push_notification', {
      p_outbox_id: delivery.outbox_id,
      p_delivered: false,
      p_retryable: details.retryable,
      p_error_class: details.errorClass,
      p_deactivate_subscription: details.deactivate,
    });
    if (completionError) throw completionError;
    console.info(JSON.stringify({ stage: 'web_push_delivery', result: 'failed', error_class: details.errorClass }));
    return 'failed' as const;
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });

  try {
    const configuredWorkerSecret = Deno.env.get('WEB_PUSH_WORKER_SECRET');
    if (!configuredWorkerSecret || request.headers.get('x-worker-secret') !== configuredWorkerSecret) {
      return new Response('forbidden', { status: 403 });
    }

    const config = runtimeConfig();

    const db = createClient(config.supabaseUrl, config.serviceRoleKey);

    let delivered = 0;
    let failed = 0;
    for (let index = 0; index < MAX_DELIVERIES_PER_RUN; index += 1) {
      const { data, error } = await db.rpc('claim_web_push_notification');
      if (error) throw error;
      if (!data) break;

      const result = await processDelivery(db, data as Delivery, config);
      if (result === 'delivered') delivered += 1;
      else failed += 1;
    }

    return Response.json({ status: 'ok', delivered, failed });
  } catch (error) {
    console.info(JSON.stringify({ stage: 'web_push_worker_failure', error_class: error instanceof Error ? error.name : 'unknown' }));
    return new Response('internal error', { status: 500 });
  }
});
