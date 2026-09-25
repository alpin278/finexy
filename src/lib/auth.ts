import type { AuthError, User } from '@supabase/supabase-js';
import type { Tables } from '../types/database';
import { supabase } from './supabase';
import { offlineErrorMessage } from './connectivity';

export type Profile = Tables<'profiles'>;

export const MIN_PASSWORD_LENGTH = 8;

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function getPasswordResetRedirectUrl(): string {
  return `${window.location.origin}/reset-password`;
}

type ProfileMetadata = {
  display_name?: unknown;
  full_name?: unknown;
  avatar_url?: unknown;
};

function getProfileMetadata(user: User): ProfileMetadata {
  return user.user_metadata as ProfileMetadata;
}

function stringMetadata(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function loadOrCreateProfile(user: User): Promise<Profile | null> {
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!existingProfile) {
    const metadata = getProfileMetadata(user);
    const { error: bootstrapError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        display_name: stringMetadata(metadata.display_name) ?? stringMetadata(metadata.full_name),
        email: user.email ?? null,
        avatar_url: stringMetadata(metadata.avatar_url),
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );

    if (bootstrapError) {
      throw bootstrapError;
    }
  }

  const { data: profile, error: reloadError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (reloadError) {
    throw reloadError;
  }

  return profile;
}

export function authErrorMessage(error: AuthError | null): string {
  if (!error) {
    return '';
  }

  const offline = offlineErrorMessage(error);
  if (offline) return offline;

  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'That email or password is not correct.';
  }

  if (message.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }

  if (message.includes('already registered') || message.includes('user already exists')) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (message.includes('password')) {
    return 'Please choose a stronger password and try again.';
  }

  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  return 'We could not complete that request. Please try again.';
}
