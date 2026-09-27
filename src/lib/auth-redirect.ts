import { Capacitor } from '@capacitor/core';
import { recoverySupabase, verificationSupabase } from './supabase';

export const NATIVE_AUTH_CALLBACK_URL = 'finexy://auth/callback';

export function getAuthRedirectUrl(webPath: string): string {
  return Capacitor.getPlatform() === 'android' ? NATIVE_AUTH_CALLBACK_URL : `${window.location.origin}${webPath}`;
}

export async function getNativeAuthCallbackDestination(rawUrl: string): Promise<string | null> {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'finexy:' || url.hostname !== 'auth' || url.pathname !== '/callback') {
    return null;
  }

  const hash = new URLSearchParams(url.hash.slice(1));
  const type = url.searchParams.get('type') ?? hash.get('type');

  if (type === 'signup') {
    const tokenHash = url.searchParams.get('token_hash');
    if (tokenHash) {
      return `/verify-email?token_hash=${encodeURIComponent(tokenHash)}&type=signup`;
    }

    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    if (!accessToken || !refreshToken) return '/verify-email';

    try {
      const { error } = await verificationSupabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      return error ? '/verify-email' : '/login';
    } catch {
      return '/verify-email';
    } finally {
      // Confirmation sessions stay isolated and are never retained as a Finexy login.
      await verificationSupabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    }
  }

  if (type === 'recovery') {
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');

    if (accessToken && refreshToken) {
      try {
        await recoverySupabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      } catch {
        // The reset route displays its existing expired/invalid-link state.
      }
    }

    return '/reset-password';
  }

  return null;
}
