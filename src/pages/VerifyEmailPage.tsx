import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { Button, Input } from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/useAuth';
import { verificationSupabase } from '../lib/supabase';

type VerificationState = 'verifying' | 'success' | 'invalid';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clearVerificationUrl() {
  window.history.replaceState({}, document.title, '/verify-email');
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resendSignupConfirmation } = useAuth();
  const [state, setState] = useState<VerificationState>('verifying');
  const [resendEmail, setResendEmail] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const tokenHash = searchParams.get('token_hash');
  const tokenType = searchParams.get('type');

  useEffect(() => {
    let active = true;

    const verifyEmail = async () => {
      if (!tokenHash || tokenType !== 'signup') {
        setState('invalid');
        clearVerificationUrl();
        return;
      }

      try {
        const { error } = await verificationSupabase.auth.verifyOtp({ token_hash: tokenHash, type: 'signup' });
        if (active) setState(error ? 'invalid' : 'success');
      } catch {
        if (active) setState('invalid');
      } finally {
        // verifyOtp may create a temporary in-memory session. It is never
        // allowed to become a persistent Finexy login session.
        await verificationSupabase.auth.signOut({ scope: 'local' });
        clearVerificationUrl();
      }
    };

    void verifyEmail();
    return () => {
      active = false;
    };
  }, [tokenHash, tokenType]);

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
