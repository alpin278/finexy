import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from './auth-context';
import { loadOrCreateProfile, type Profile } from '../lib/auth';
import { supabase } from '../lib/supabase';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const retryAuth = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      setSession(data.session);
      setProfileLoading(Boolean(data.session));
    } catch (err) {
      setSession(null);
      setAuthError(err instanceof Error ? err : new Error(String(err)));
      setProfileLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) throw error;
        setSession(data.session);
        setAuthError(null);
        setLoading(false);
        setProfileLoading(Boolean(data.session));
      })
      .catch((err) => {
        if (!isMounted) return;
        setSession(null);
        setAuthError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
        setProfileLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      // INITIAL_SESSION is handled canonically by getSession() above
      if (event === 'INITIAL_SESSION') return;

      setSession(nextSession);
      setLoading(false);
      setProfileLoading(Boolean(nextSession));

      if (!nextSession) {
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const authenticatedUser = session?.user ?? null;

    if (!authenticatedUser) {
      return () => {
        isMounted = false;
      };
    }

    void loadOrCreateProfile(authenticatedUser)
      .then((nextProfile) => {
        if (isMounted) {
          setProfile(nextProfile);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProfile(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setProfileLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      loading,
      authReady: !loading,
      authError,
      retryAuth,
      profileLoading,
      refreshProfile: async () => {
        if (!session?.user) return null;
        setProfileLoading(true);
        try {
          const nextProfile = await loadOrCreateProfile(session.user);
          setProfile(nextProfile);
          return nextProfile;
        } finally {
          setProfileLoading(false);
        }
      },
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
      },
      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        return { data, error };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
      },
    }),
    [authError, loading, profile, profileLoading, retryAuth, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
