import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { Button, Input } from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/useAuth';
import { offlineErrorMessage } from '../lib/connectivity';
import { isValidPassword } from '../lib/auth';
import { recoverySupabase } from '../lib/supabase';

type ResetState = 'resolving' | 'ready' | 'invalid';

function clearRecoveryUrl() {
  window.history.replaceState({}, document.title, '/reset-password');
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, clearRecoverySession } = useAuth();
  const [state, setState] = useState<ResetState>('resolving');
  const [resolutionMessage, setResolutionMessage] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const resolveRecovery = async () => {
      setState('resolving');
      setResolutionMessage('');

      try {
        const { data, error: sessionError } = await recoverySupabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) {
          if (active) {
            setState('invalid');
            clearRecoveryUrl();
          }
          return;
        }

        if (!active) return;
        setRecoveryEmail(data.session.user.email ?? null);
        setState('ready');
        clearRecoveryUrl();
      } catch (sessionError) {
        if (!active) return;
        const offline = offlineErrorMessage(sessionError);
        setResolutionMessage(offline ?? 'This password reset link is invalid or has expired.');
        setState('invalid');
        if (!offline) clearRecoveryUrl();
      }
    };

    void resolveRecovery();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!isValidPassword(newPassword)) {
      setError('Use a password with at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (result.error) {
      setError(offlineErrorMessage(result.error) ?? 'We could not update your password. Please request a new reset link and try again.');
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    try {
      await clearRecoverySession();
    } finally {
      navigate('/login', { replace: true, state: { email: recoveryEmail ?? undefined } });
    }
  };

  if (state === 'resolving') {
    return (
      <AuthPageLayout>
        <div role="status" aria-live="polite" className="py-5 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Icon name="shield-check" className="text-xl motion-safe:animate-pulse" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[30px]">Preparing your reset</h1>
          <p className="mt-3 text-sm leading-relaxed text-secondary">We’re securely checking your password reset link.</p>
        </div>
      </AuthPageLayout>
    );
  }

  if (state === 'invalid') {
    const offline = resolutionMessage === 'Internet connection required.';
    return (
      <AuthPageLayout>
        <div className="py-2 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <Icon name={offline ? 'wifi-off' : 'exclamation-lg'} className="text-xl" aria-hidden="true" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Account recovery</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[30px]">{offline ? 'Connection required' : 'Reset link unavailable'}</h1>
          <p role="alert" className="mt-3 text-sm leading-relaxed text-secondary">{resolutionMessage || 'This password reset link is invalid or has expired.'}</p>
          {offline ? (
            <Button type="button" variant="accent" className="mt-7 w-full" onClick={() => window.location.reload()}>Try again</Button>
          ) : (
            <Link to="/forgot-password" className="mt-7 inline-flex h-10 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 hover:bg-accent-hover hover:-translate-y-px hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Request a new reset link</Link>
          )}
          <Link to="/login" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full border border-border bg-transparent px-5 text-sm font-medium text-primary transition-[background-color,border-color,color,box-shadow,transform] duration-150 hover:border-border-hover hover:bg-surface hover:-translate-y-px hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Back to Sign In</Link>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <div className="mb-7">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon name="key" className="text-xl" aria-hidden="true" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Account recovery</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[30px]">Set a new password</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">Choose a new password for your secure Finexy account.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && <p role="alert" className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs font-semibold leading-relaxed text-danger">{error}</p>}
        <div>
          <label htmlFor="reset-new-password" className="mb-1.5 block text-xs font-semibold text-primary">New password</label>
          <Input id="reset-new-password" type={showNewPassword ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="At least 8 characters" leftIcon={<Icon name="lock" />} rightIcon={<button type="button" aria-label={showNewPassword ? 'Hide new password' : 'Show new password'} className="rounded-md p-1 text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25" onClick={() => setShowNewPassword((visible) => !visible)}><Icon name={showNewPassword ? 'eye-slash' : 'eye'} /></button>} />
        </div>
        <div>
          <label htmlFor="reset-confirm-password" className="mb-1.5 block text-xs font-semibold text-primary">Confirm new password</label>
          <Input id="reset-confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your new password" leftIcon={<Icon name="lock" />} rightIcon={<button type="button" aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} className="rounded-md p-1 text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25" onClick={() => setShowConfirmPassword((visible) => !visible)}><Icon name={showConfirmPassword ? 'eye-slash' : 'eye'} /></button>} />
        </div>
        <p className="text-xs leading-relaxed text-secondary">Use at least 8 characters. Your password remains private to Finexy.</p>
        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>Update password</Button>
      </form>
    </AuthPageLayout>
  );
}

export default ResetPasswordPage;
