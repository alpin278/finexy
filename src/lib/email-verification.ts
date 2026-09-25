import { verificationSupabase } from './supabase';

export type VerificationWatchStatus = 'pending' | 'verified' | 'expired';

function randomToken(bytes = 32): string {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  let binary = '';
  values.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function createSignupWatchNonce(): string {
  return randomToken();
}

export function getEmailVerificationRedirectUrl(): string {
  return `${window.location.origin}/verify-email`;
}

export async function createVerificationWatch(userId: string, nonce: string): Promise<string> {
  const { data, error } = await verificationSupabase.functions.invoke<{ token?: unknown }>('email-verification-watch', {
    body: { action: 'create', user_id: userId, nonce },
  });

  if (error || typeof data?.token !== 'string' || !data.token) {
    throw error ?? new Error('Verification watch could not be created.');
  }

  return data.token;
}

export async function getVerificationWatchStatus(token: string): Promise<VerificationWatchStatus> {
  const { data, error } = await verificationSupabase.functions.invoke<{ status?: unknown }>('email-verification-watch', {
    body: { action: 'status', token },
  });

  if (error) throw error;
  if (data?.status === 'pending' || data?.status === 'verified' || data?.status === 'expired') {
    return data.status;
  }
  throw new Error('Verification watch returned an invalid status.');
}

