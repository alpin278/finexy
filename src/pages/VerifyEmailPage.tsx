import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { Button, Input } from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/useAuth';
import { verificationSupabase } from '../lib/supabase';

type VerificationState = 'verifying' | 'success' | 'invalid';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clearVerificationUrl() {
  if (typeof window !== 'undefined' && (window.location.search || window.location.hash)) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { resendSignupConfirmation } = useAuth();
  const [state, setState] = useState<VerificationState>('verifying');
  const [resendEmail, setResendEmail] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    let active = true;

    const verifyEmail = async () => {
      const search = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const hasError = Boolean(
        search.get('error') ||
        hash.get('error') ||
        search.get('error_code') ||
        hash.get('error_code')
      );

      if (hasError) {
        if (active) setState('invalid');
        clearVerificationUrl();
        return;
      }

      const tokenHash = search.get('token_hash') || hash.get('token_hash');
      const tokenType = search.get('type') || hash.get('type');
      const accessToken = hash.get('access_token') || search.get('access_token');
      const refreshToken = hash.get('refresh_token') || search.get('refresh_token');
      const code = search.get('code') || hash.get('code');

      try {
        if (tokenHash) {
          // Backward compatibility: existing token_hash OTP verification
          if (tokenType && tokenType !== 'signup') {
            if (active) setState('invalid');
            return;
          }
          const { error } = await verificationSupabase.auth.verifyOtp({ token_hash: tokenHash, type: 'signup' });
          if (active) setState(error ? 'invalid' : 'success');
        } else if (accessToken && refreshToken) {
          // Standard Supabase ConfirmationURL redirect result: session tokens in hash fragment
          if (tokenType && tokenType !== 'signup') {
            if (active) setState('invalid');
            return;
          }
          const { data, error } = await verificationSupabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (active) setState(error || !data.session ? 'invalid' : 'success');
        } else if (code) {
          // PKCE flow support if code parameter was returned
          const { data, error } = await verificationSupabase.auth.exchangeCodeForSession(code);
          if (active) setState(error || !data.session ? 'invalid' : 'success');
        } else {
          // No recognizable verification payload present
          if (active) setState('invalid');
        }
      } catch {
        if (active) setState('invalid');
      } finally {
        // Confirmation/verification may create a temporary in-memory session.
        // It is never allowed to become a persistent Finexy login session.
        await verificationSupabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        clearVerificationUrl();
      }
    };

    void verifyEmail();
    return () => {
      active = false;
    };
  }, []);

  const handleResend = async () => {
    const email = resendEmail.trim();
    if (!emailPattern.test(email)) return;
    setResendBusy(true);
    setResendMessage('');
    const result = await resendSignupConfirmation(email);
    setResendBusy(false);
    setResendMessage(result.error
      ? 'We could not send a new verification email. Please try again later.'
      : 'If this address is eligible, a new verification email is on its way.');
  };

  return (
    <AuthPageLayout>
      {state === 'verifying' && (
        <div className="py-5 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Icon name="shield-check" className="text-xl motion-safe:animate-pulse" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[30px]">Verifying your email...</h1>
          <p className="mt-3 text-sm leading-relaxed text-secondary">Please wait while Finexy confirms ownership of this email address.</p>
        </div>
      )}

      {state === 'success' && (
        <div className="py-2 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <Icon name="check-lg" className="text-2xl" aria-hidden="true" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Finexy account security</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[30px]">Email verified</h1>
          <p className="mt-3 text-sm leading-relaxed text-secondary">Your email has been verified. You can now sign in to Finexy.</p>
          <p className="mt-3 text-xs leading-relaxed text-secondary">This page did not sign you in. You can safely close it or return to the device where you created your account.</p>
          <Button type="button" variant="accent" className="mt-7 w-full" onClick={() => navigate('/login', { replace: true })}>Go to Sign In</Button>
        </div>
      )}

      {state === 'invalid' && (
        <div>
          <div className="mb-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <Icon name="exclamation-lg" className="text-xl" aria-hidden="true" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Finexy account security</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[30px]">Verification link unavailable</h1>
            <p className="mt-3 text-sm leading-relaxed text-secondary">Verification link is invalid or has expired.</p>
          </div>

          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void handleResend(); }} noValidate>
            <label htmlFor="verify-resend-email" className="mb-1.5 block text-xs font-semibold text-primary">Email address for a new link</label>
            <Input id="verify-resend-email" type="email" autoComplete="email" value={resendEmail} onChange={(event) => setResendEmail(event.target.value)} placeholder="you@example.com" />
            <Button type="submit" variant="accent" className="w-full" loading={resendBusy} disabled={!emailPattern.test(resendEmail.trim())}>Resend verification</Button>
          </form>
          {resendMessage && <p role="status" className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-secondary">{resendMessage}</p>}
          <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => navigate('/login', { replace: true })}>Back to Sign In</Button>
        </div>
      )}
    </AuthPageLayout>
  );
}

export default VerifyEmailPage;
