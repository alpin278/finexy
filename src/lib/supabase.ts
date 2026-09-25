import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { ConnectivityError, getBrowserOnline } from './connectivity';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment configuration.');
}

const nativeFetch = globalThis.fetch.bind(globalThis);
const connectivityFetch: typeof fetch = async (input, init) => {
  if (!getBrowserOnline()) throw new ConnectivityError();
  return nativeFetch(input, init);
};

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  global: { fetch: connectivityFetch },
  auth: {
    // Keep OAuth/code redirects working everywhere except the explicit
    // verification route, which must never be auto-exchanged into a session.
    detectSessionInUrl: (url) => !url.pathname.endsWith('/verify-email'),
  },
});

/**
 * Email signup and token verification use an isolated, non-persistent client.
 * A confirmation response can contain a session; this client prevents that
 * temporary session from becoming the user's Finexy login session.
 */
export const verificationSupabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  global: { fetch: connectivityFetch },
  auth: {
    storageKey: 'finexy-email-verification',
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Support test/development environments simulating network stalls
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
  supabase.auth.getSession = async () => {
    if ((window as unknown as { __SIMULATE_STALL__?: boolean }).__SIMULATE_STALL__) {
      return new Promise(() => {});
    }
    return originalGetSession();
  };
}
