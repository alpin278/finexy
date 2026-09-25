import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { Button, Input } from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/useAuth';
import { authErrorMessage } from '../lib/auth';
import { getVerificationWatchStatus } from '../lib/email-verification';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const resendCooldownSeconds = 60;

function maskEmail(value: string): string {
  const [localPart, domain] = value.split('@');
  if (!localPart || !domain) return value;
  return `${localPart.slice(0, 1)}${'*'.repeat(Math.max(2, Math.min(localPart.length - 1, 5)))}@${domain}`;
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp, resendSignupConfirmation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [verificationWatchToken, setVerificationWatchToken] = useState<string | null>(null);
  const [watchExpired, setWatchExpired] = useState(false);
  const [watchUnavailable, setWatchUnavailable] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  const maskedEmail = useMemo(() => maskEmail(email.trim()), [email]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!verificationWatchToken) return;
    let active = true;
    let checking = false;

    const checkVerification = async () => {
      if (checking) return;
      checking = true;
      try {
        const status = await getVerificationWatchStatus(verificationWatchToken);
        if (!active) return;
        if (status === 'verified') {
          navigate('/login', { replace: true, state: { email: email.trim() } });
        } else if (status === 'expired') {
          setVerificationWatchToken(null);
          setWatchExpired(true);
        }
      } catch {
        // Keep the explicit sign-in fallback available through transient errors.
      } finally {
        checking = false;
      }
    };

    void checkVerification();
    const timer = window.setInterval(() => void checkVerification(), 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [email, navigate, verificationWatchToken]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(email.trim(), password);
    setIsSubmitting(false);

    if (result.error) {
      setError(authErrorMessage(result.error));
      return;
    }

    setPassword('');
    setConfirmPassword('');
    setAwaitingVerification(true);
    setVerificationWatchToken(result.verificationWatchToken);
    setWatchExpired(false);
    setWatchUnavailable(Boolean(result.verificationWatchError));
    setResendCooldown(resendCooldownSeconds);
    setResendMessage('');
    setResendError('');
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendMessage('');
    setResendError('');
    const result = await resendSignupConfirmation(email.trim());
    if (result.error) {
      setResendError('We could not send a new verification email. Please try again later.');
      return;
    }
    setResendCooldown(resendCooldownSeconds);
    setResendMessage('If this address is eligible, a new verification email is on its way.');
  };

  if (awaitingVerification) {
    return (
      <AuthPageLayout>
        <div className="mb-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
            <Icon name="envelope-check" className="text-xl" aria-hidden="true" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Almost there</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[30px]">Check your email</h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary">We sent a verification link to:</p>
          <p className="mt-1 break-all text-sm font-semibold text-primary">{maskedEmail}</p>
        </div>

        <div role="status" className="rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-xs leading-relaxed text-primary">
          {watchExpired
            ? 'This verification wait expired. After confirming your email, use Sign in below.'
            : 'This page will take you to Sign in automatically once your email is verified.'}
        </div>

        {watchUnavailable && <p role="status" className="mt-3 text-xs leading-relaxed text-secondary">Automatic detection is temporarily unavailable. You can still verify your email and use Sign in below.</p>}
        {resendError && <p role="alert" className="mt-3 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs font-semibold leading-relaxed text-danger">{resendError}</p>}
        {resendMessage && <p role="status" className="mt-3 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-xs leading-relaxed text-primary">{resendMessage}</p>}

        <div className="mt-6 space-y-3">
          <Button type="button" variant="accent" className="w-full" onClick={() => void handleResend()} disabled={resendCooldown > 0}>
            {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification email'}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/login', { replace: true, state: { email: email.trim() } })}>
            I've verified my email — Go to Sign In
          </Button>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <div className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Start fresh</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[30px]">Create your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">Set up your private Finexy workspace in a few seconds.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && <p role="alert" className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs font-semibold leading-relaxed text-danger">{error}</p>}
        <div>
          <label htmlFor="signup-email" className="mb-1.5 block text-xs font-semibold text-primary">Email address</label>
          <Input id="signup-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" leftIcon={<Icon name="envelope" />} />
        </div>
        <div>
          <label htmlFor="signup-password" className="mb-1.5 block text-xs font-semibold text-primary">Password</label>
          <Input id="signup-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" leftIcon={<Icon name="lock" />} />
        </div>
        <div>
          <label htmlFor="signup-confirm-password" className="mb-1.5 block text-xs font-semibold text-primary">Confirm password</label>
          <Input id="signup-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" leftIcon={<Icon name="lock" />} />
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</Button>
      </form>

      <p className="mt-6 text-center text-xs text-secondary">Already have an account? <Link to="/login" className="font-semibold text-accent hover:text-accent-hover">Sign in</Link></p>
    </AuthPageLayout>
  );
}

export default SignupPage;
