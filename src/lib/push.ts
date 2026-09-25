import { supabase } from './supabase';
import { assertOnline, isConnectivityError, OFFLINE_MESSAGE } from './connectivity';

export type PushNotificationStatus = 'unsupported' | 'configuration-unavailable' | 'not-enabled' | 'enabled' | 'denied';

type PushErrorCode = 'auth' | 'configuration' | 'permission' | 'service-worker' | 'subscribe' | 'registration';

export class PushNotificationError extends Error {
  readonly code: PushErrorCode;
  readonly causeName?: string;
  readonly causeMessage?: string;

  constructor(
    code: PushErrorCode,
    message: string,
    causeName?: string,
    causeMessage?: string,
  ) {
    super(message);
    this.name = 'PushNotificationError';
    this.code = code;
    this.causeName = causeName;
    this.causeMessage = causeMessage;
  }
}

export interface PushNotificationState {
  status: PushNotificationStatus;
  detail: string;
}

const unsupportedDetail = 'Push notifications are not available in this browser.';
const vapidKey = (import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY as string | undefined ?? '').trim();

function safeErrorDetails(error: unknown) {
  const candidate = error && typeof error === 'object' ? error as { name?: unknown; message?: unknown } : undefined;
  const name = String(candidate?.name ?? (error instanceof Error ? error.name : 'Error')).slice(0, 80);
  const message = String(candidate?.message ?? (error instanceof Error ? error.message : error ?? 'Unknown error'))
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/https?:\/\/\S+/gi, '[redacted-url]')
    .slice(0, 240);
  return { name, message };
}

function logPushFailure(operation: string, error: unknown) {
  if (import.meta.env.DEV) console.warn(`[push] ${operation} failed`, safeErrorDetails(error));
}

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
  if (!hasBrowserPushSupport() || !hasValidVapidConfiguration()) return false;
  return !(isIOSDevice() && !isStandalone());
}

function keyToUint8Array(value: string) {
  const normalized = value.trim().replace(/-/g, '+').replace(/_/g, '/');
  if (normalized.length % 4 === 1) throw new Error('The configured Web Push public key is invalid.');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = window.atob(normalized + padding);
  const key = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (key.length !== 65 || key[0] !== 4) throw new Error('The configured Web Push public key is invalid.');
  return key;
}

function hasBrowserPushSupport() {
  return typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window;
}

function hasValidVapidConfiguration() {
  if (!vapidKey || typeof window === 'undefined') return false;
  try {
    keyToUint8Array(vapidKey);
    return true;
  } catch {
    return false;
  }
}

function unsupportedState(): PushNotificationState {
  return {
    status: 'unsupported',
    detail: isIOSDevice() && !isStandalone()
      ? 'Install Finexy to your Home Screen before enabling push notifications on iPhone or iPad.'
      : unsupportedDetail,
  };
}

function configurationUnavailableState(): PushNotificationState {
  return { status: 'configuration-unavailable', detail: 'Push configuration unavailable. Please try again later.' };
}

async function serviceWorkerRegistration() {
  let timeoutId: number | undefined;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    const registration = existing ?? await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error('Finexy service worker is not ready yet. Please refresh and try again.')), 5000);
        }),
      ]);
    if (!registration.pushManager) throw new PushNotificationError('service-worker', 'Push notifications are unavailable until Finexy service worker is ready.');
    return registration;
  } catch (error) {
    if (error instanceof PushNotificationError) throw error;
    logPushFailure('service worker', error);
    const details = safeErrorDetails(error);
    throw new PushNotificationError('service-worker', 'Finexy service worker is not ready yet. Please refresh and try again.', details.name, details.message);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}

async function currentSubscription() {
  const registration = await serviceWorkerRegistration();
  try {
    return { registration, subscription: await registration.pushManager.getSubscription() };
  } catch (error) {
    logPushFailure('subscription lookup', error);
    const details = safeErrorDetails(error);
    throw new PushNotificationError('subscribe', 'Couldn\'t enable notifications — Try again.', details.name, details.message);
  }
}

function subscriptionPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) throw new Error('The browser returned an incomplete push subscription.');
  return { endpoint: json.endpoint, p256dh, auth };
}

export async function loadPushNotificationState(): Promise<PushNotificationState> {
  if (!hasBrowserPushSupport()) return unsupportedState();
  if (!hasValidVapidConfiguration()) return configurationUnavailableState();
  if (isIOSDevice() && !isStandalone()) return unsupportedState();

  if (Notification.permission === 'denied') {
    return { status: 'denied', detail: 'Push permission is blocked. Enable it from your browser or site settings.' };
  }
  if (Notification.permission !== 'granted') {
    return { status: 'not-enabled', detail: 'Enable push notifications on this device when you are ready.' };
  }

  const { subscription } = await currentSubscription();
  if (!subscription) return { status: 'not-enabled', detail: 'Enable push notifications on this device when you are ready.' };

  await ensureAuthenticatedUser();
  const { endpoint } = subscriptionPayload(subscription);
  const { data, error } = await supabase
    .from('web_push_subscriptions')
    .select('is_active')
    .eq('endpoint', endpoint)
    .maybeSingle();
  if (error) throw pushErrorFromServer('status lookup', error);

  return data?.is_active
    ? { status: 'enabled', detail: 'Push notifications are enabled on this device.' }
    : { status: 'not-enabled', detail: 'Enable push notifications on this device when you are ready.' };
}

export async function enablePushNotifications(): Promise<PushNotificationState> {
  assertOnline();
  if (!hasBrowserPushSupport()) return unsupportedState();
  if (!hasValidVapidConfiguration()) return configurationUnavailableState();
  if (isIOSDevice() && !isStandalone()) return unsupportedState();
  if (Notification.permission === 'denied') {
    return { status: 'denied', detail: 'Push permission is blocked. Enable it from your browser or site settings.' };
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      logPushFailure('permission request', error);
      const details = safeErrorDetails(error);
      throw new PushNotificationError('permission', 'Notification permission could not be requested. Please try again.', details.name, details.message);
    }
  }
  if (permission === 'denied') {
    return { status: 'denied', detail: 'Push permission is blocked. Enable it from your browser or site settings.' };
  }
  if (permission !== 'granted') {
    return { status: 'not-enabled', detail: 'Notification permission was not granted. You can try again when you are ready.' };
  }

  await ensureAuthenticatedUser();
  const { registration, subscription: existing } = await currentSubscription();
  let subscription = existing;
  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyToUint8Array(vapidKey),
      });
    } catch (error) {
      logPushFailure('subscription creation', error);
      const details = safeErrorDetails(error);
      throw new PushNotificationError('subscribe', 'Couldn\'t enable notifications — Try again.', details.name, details.message);
    }
  }
  const payload = subscriptionPayload(subscription);

  const { error } = await supabase.rpc('register_web_push_subscription', {
    p_endpoint: payload.endpoint,
    p_p256dh_key: payload.p256dh,
    p_auth_key: payload.auth,
  });
  if (error) {
    if (!existing) await subscription.unsubscribe().catch(() => undefined);
    throw pushErrorFromServer('subscription registration', error);
  }

  return { status: 'enabled', detail: 'Push notifications are enabled on this device.' };
}

export async function disablePushNotifications(): Promise<PushNotificationState> {
  assertOnline();
  if (!hasBrowserPushSupport()) return unsupportedState();
  if (!hasValidVapidConfiguration()) return configurationUnavailableState();
  if (isIOSDevice() && !isStandalone()) return unsupportedState();

  const { subscription } = await currentSubscription();
  if (!subscription) return { status: 'not-enabled', detail: 'Push notifications are not enabled on this device.' };

  const { endpoint } = subscriptionPayload(subscription);
  await ensureAuthenticatedUser();
  const { error } = await supabase.rpc('deactivate_web_push_subscription', { p_endpoint: endpoint });
  if (error) throw pushErrorFromServer('subscription deactivation', error, 'Couldn\'t disable notifications — Try again.');
  await subscription.unsubscribe();
  return { status: 'not-enabled', detail: 'Push notifications are disabled on this device.' };
}

async function ensureAuthenticatedUser() {
  let lastError: unknown;
  try {
    const sessionResult = await supabase.auth.getSession();
    lastError = sessionResult.error;
    if (sessionResult.data.session) {
      const userResult = await supabase.auth.getUser();
      if (!userResult.error && userResult.data.user) return userResult.data.user;
      lastError = userResult.error;
    }
  } catch (error) {
    if (isConnectivityError(error)) throw error;
    lastError = error;
  }

  try {
    const refreshResult = await supabase.auth.refreshSession();
    if (refreshResult.error) lastError = refreshResult.error;
    if (refreshResult.data.session) {
      const userResult = await supabase.auth.getUser();
      if (!userResult.error && userResult.data.user) return userResult.data.user;
      lastError = userResult.error;
    }
  } catch (error) {
    if (isConnectivityError(error)) throw error;
    lastError = error;
  }

  const details = safeErrorDetails(lastError);
  throw new PushNotificationError('auth', 'Please sign in again.', details.name, details.message);
}

function isAuthFailure(error: unknown) {
  const candidate = error && typeof error === 'object' ? error as { status?: unknown; code?: unknown; message?: unknown } : undefined;
  const status = Number(candidate?.status);
  const message = String(candidate?.message ?? '').toLowerCase();
  return status === 401 || status === 403 || String(candidate?.code ?? '').toLowerCase().includes('auth')
    || /jwt|unauthori[sz]ed|authentication required|not authenticated|session/i.test(message);
}

function pushErrorFromServer(operation: string, error: unknown, fallback = 'Couldn\'t enable notifications — Try again.') {
  if (isConnectivityError(error)) return error;
  const details = safeErrorDetails(error);
  if (isAuthFailure(error)) return new PushNotificationError('auth', 'Please sign in again.', details.name, details.message);
  logPushFailure(operation, error);
  return new PushNotificationError('registration', fallback, details.name, details.message);
}

export function pushErrorMessage(error: unknown, fallback = 'Couldn\'t enable notifications — Try again.') {
  if (isConnectivityError(error)) return OFFLINE_MESSAGE;
  if (error instanceof PushNotificationError) return error.message;
  return fallback;
}

export async function suspendPushNotificationsForSignOut(): Promise<boolean> {
  // Sign-out must still remove the physical browser subscription even if the
  // current deployment has a missing/invalid VAPID configuration. This path
  // does not need a VAPID key and protects shared browsers from cross-account
  // delivery.
  if (!hasBrowserPushSupport() || Notification.permission !== 'granted') return true;

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
