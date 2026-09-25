import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthError, type Session } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from './auth-context';
import { getPasswordResetRedirectUrl, loadOrCreateProfile, type Profile } from '../lib/auth';
import { createSignupWatchNonce, createVerificationWatch, getEmailVerificationRedirectUrl } from '../lib/email-verification';
import { recoverySupabase, supabase, verificationSupabase } from '../lib/supabase';
import { suspendPushNotificationsForSignOut } from '../lib/push';

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
        const watchNonce = createSignupWatchNonce();
        const { data, error } = await verificationSupabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getEmailVerificationRedirectUrl(),
            data: { finexy_verification_watch_nonce: watchNonce },
          },
        });

        if (error || !data.user) {
          return { data, error, verificationWatchToken: null, verificationWatchError: null };
        }

        // The isolated client does not persist sessions, but clear the
        // temporary in-memory confirmation session as an additional guard.
        if (data.session) {
          await verificationSupabase.auth.signOut({ scope: 'local' });
        }

        try {
          const verificationWatchToken = await createVerificationWatch(data.user.id, watchNonce);
          return { data: { ...data, session: null }, error: null, verificationWatchToken, verificationWatchError: null };
        } catch (verificationWatchError) {
          return { data: { ...data, session: null }, error: null, verificationWatchToken: null, verificationWatchError: verificationWatchError instanceof Error ? verificationWatchError : new Error(String(verificationWatchError)) };
        }
      },
      resendSignupConfirmation: async (email) => {
        const { error } = await verificationSupabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: getEmailVerificationRedirectUrl() },
        });
        return { error };
      },
      sendPasswordResetEmail: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getPasswordResetRedirectUrl(),
        });
        return { error };
      },
      updatePassword: async (password) => {
        const { error } = await recoverySupabase.auth.updateUser({ password });
        return { error };
      },
      clearRecoverySession: async () => {
        try {
          await recoverySupabase.auth.signOut({ scope: 'local' });
        } finally {
          await supabase.auth.signOut({ scope: 'local' });
        }
      },
      signOut: async () => {
        const pushSuspended = await suspendPushNotificationsForSignOut().catch(() => false);
        if (!pushSuspended) return { error: new AuthError('Push notifications could not be safely disabled on this device. Please try again while online.', 0, 'push_logout_blocked') };
        const { error } = await supabase.auth.signOut();
        return { error };
      },
    }),
    [authError, loading, profile, profileLoading, retryAuth, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
