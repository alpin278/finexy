import { createContext } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import type { Profile } from '../lib/auth';

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  authReady: boolean;
  authError: Error | AuthError | null;
  retryAuth: () => Promise<void>;
  profileLoading: boolean;
  refreshProfile: () => Promise<Profile | null>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{
    data: { session: Session | null; user: User | null };
    error: AuthError | null;
    verificationWatchToken: string | null;
    verificationWatchError: Error | null;
  }>;
  resendSignupConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
