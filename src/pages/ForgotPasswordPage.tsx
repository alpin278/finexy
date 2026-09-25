import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { Button, Input } from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/useAuth';
import { offlineErrorMessage } from '../lib/connectivity';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const { sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim();
    if (!emailPattern.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await sendPasswordResetEmail(normalizedEmail);
    setIsSubmitting(false);

    if (result.error) {
      setError(offlineErrorMessage(result.error) ?? 'We could not send a password reset email. Please try again.');
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AuthPageLayout>
        <div className="py-2 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <Icon name="envelope-check" className="text-2xl" aria-hidden="true" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Account recovery</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[30px]">Check your email</h1>
          <p role="status" className="mt-3 text-sm leading-relaxed text-secondary">If an account matches that email address, we’ll send a password reset link shortly.</p>
          <p className="mt-3 text-xs leading-relaxed text-secondary">The link will open a secure Finexy password reset page. You can safely close this page.</p>
          <Link to="/login" className="mt-7 inline-flex h-10 w-full items-center justify-center rounded-full border border-border bg-transparent px-5 text-sm font-medium text-primary transition-[background-color,border-color,color,box-shadow,transform] duration-150 hover:border-border-hover hover:bg-surface hover:-translate-y-px hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Back to Sign In</Link>
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
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[30px]">Forgot your password?</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">Enter your email and we’ll send a secure link to reset your Finexy password.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && <p role="alert" className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs font-semibold leading-relaxed text-danger">{error}</p>}
        <div>
          <label htmlFor="forgot-password-email" className="mb-1.5 block text-xs font-semibold text-primary">Email address</label>
          <Input id="forgot-password-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" leftIcon={<Icon name="envelope" />} />
        </div>
        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>Send reset link</Button>
      </form>

      <p className="mt-6 text-center text-xs text-secondary"><Link to="/login" className="font-semibold text-accent hover:text-accent-hover">Back to Sign In</Link></p>
    </AuthPageLayout>
  );
}

export default ForgotPasswordPage;
