import { supabase } from './supabase';
import { assertOnline } from './connectivity';

export type PushNotificationStatus = 'unsupported' | 'not-enabled' | 'enabled' | 'denied';

export interface PushNotificationState {
  status: PushNotificationStatus;
  detail: string;
}

const unsupportedDetail = 'Push notifications are not available in this browser.';
const vapidKey = import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY as string | undefined;

function isStandalone() {
  return typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isWebPushSupported() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!vapidKey || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  return !(isIOSDevice() && !isStandalone());
}

function keyToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const binary = window.atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding);
  const key = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (key.length !== 65 || key[0] !== 4) throw new Error('The configured Web Push public key is invalid.');
  return key;
}

async function serviceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;

  let timeoutId: number | undefined;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error('Finexy service worker is not ready yet. Please refresh and try again.')), 5000);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}

async function currentSubscription() {
  const registration = await serviceWorkerRegistration();
  return { registration, subscription: await registration.pushManager.getSubscription() };
}

function subscriptionPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) throw new Error('The browser returned an incomplete push subscription.');
  return { endpoint: json.endpoint, p256dh, auth };
}

export async function loadPushNotificationState(): Promise<PushNotificationState> {
  if (!isWebPushSupported()) {
    return {
      status: 'unsupported',
      detail: isIOSDevice() && !isStandalone()
        ? 'Install Finexy to your Home Screen before enabling push notifications on iPhone or iPad.'
        : unsupportedDetail,
    };
  }

  if (Notification.permission === 'denied') {
    return { status: 'denied', detail: 'Push permission is blocked. Enable it from your browser or site settings.' };
  }
  if (Notification.permission !== 'granted') {
    return { status: 'not-enabled', detail: 'Enable push notifications on this device when you are ready.' };
  }

  const { subscription } = await currentSubscription();
  if (!subscription) return { status: 'not-enabled', detail: 'Enable push notifications on this device when you are ready.' };

  const { endpoint } = subscriptionPayload(subscription);
  const { data, error } = await supabase
    .from('web_push_subscriptions')
    .select('is_active')
    .eq('endpoint', endpoint)
    .maybeSingle();
  if (error) throw error;

  return data?.is_active
    ? { status: 'enabled', detail: 'Push notifications are enabled on this device.' }
    : { status: 'not-enabled', detail: 'Enable push notifications on this device when you are ready.' };
}

export async function enablePushNotifications(): Promise<PushNotificationState> {
  assertOnline();
  if (!isWebPushSupported()) return loadPushNotificationState();
  if (Notification.permission === 'denied') return loadPushNotificationState();

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();
  if (permission !== 'granted') return loadPushNotificationState();

  const { registration, subscription: existing } = await currentSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyToUint8Array(vapidKey!),
  });
  const payload = subscriptionPayload(subscription);

  const { error } = await supabase.rpc('register_web_push_subscription', {
    p_endpoint: payload.endpoint,
    p_p256dh_key: payload.p256dh,
    p_auth_key: payload.auth,
  });
  if (error) {
    if (!existing) await subscription.unsubscribe().catch(() => undefined);
    throw error;
  }

  return { status: 'enabled', detail: 'Push notifications are enabled on this device.' };
}

export async function disablePushNotifications(): Promise<PushNotificationState> {
  assertOnline();
  if (!isWebPushSupported()) return loadPushNotificationState();

  const { subscription } = await currentSubscription();
  if (!subscription) return { status: 'not-enabled', detail: 'Push notifications are not enabled on this device.' };

  const { endpoint } = subscriptionPayload(subscription);
  const { error } = await supabase.rpc('deactivate_web_push_subscription', { p_endpoint: endpoint });
  if (error) throw error;
  await subscription.unsubscribe();
  return { status: 'not-enabled', detail: 'Push notifications are disabled on this device.' };
}

export async function suspendPushNotificationsForSignOut(): Promise<boolean> {
  if (!isWebPushSupported() || Notification.permission !== 'granted') return true;

  let subscription: PushSubscription | null;
  try {
    ({ subscription } = await currentSubscription());
  } catch {
    return false;
  }
  if (!subscription) return true;

  let endpoint: string;
  try {
    endpoint = subscriptionPayload(subscription).endpoint;
  } catch {
    return false;
  }

  // Remove the physical browser subscription first. This closes the shared-device
  // gap even when the server deactivation request cannot reach Supabase.
  const localUnsubscribed = await subscription.unsubscribe().catch(() => false);
  const serverDeactivated = navigator.onLine
    ? !(await supabase.rpc('deactivate_web_push_subscription', { p_endpoint: endpoint })).error
    : false;

  return localUnsubscribed || serverDeactivated;
}
