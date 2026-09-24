import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment configuration.');
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey);

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
