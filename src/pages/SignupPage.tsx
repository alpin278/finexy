import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, LockKeyhole, Mail } from 'lucide-react';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/useAuth';
import { authErrorMessage } from '../lib/auth';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

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

    if (result.data.session) {
      navigate('/overview', { replace: true });
      return;
    }

    setSuccess('Check your email to confirm your account before signing in.');
  };

  return (
    <AuthPageLayout>
      <div className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Start fresh</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[30px]">Create your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">Set up your private Finexy workspace in a few seconds.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && <p role="alert" className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs font-semibold leading-relaxed text-danger">{error}</p>}
        {success && <p role="status" className="flex items-start gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-xs font-semibold leading-relaxed text-primary"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />{success}</p>}
        <div>
          <label htmlFor="signup-email" className="mb-1.5 block text-xs font-semibold text-primary">Email address</label>
          <Input id="signup-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} />
        </div>
        <div>
          <label htmlFor="signup-password" className="mb-1.5 block text-xs font-semibold text-primary">Password</label>
          <Input id="signup-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" leftIcon={<LockKeyhole className="h-4 w-4" />} />
        </div>
        <div>
          <label htmlFor="signup-confirm-password" className="mb-1.5 block text-xs font-semibold text-primary">Confirm password</label>
          <Input id="signup-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" leftIcon={<LockKeyhole className="h-4 w-4" />} />
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</Button>
      </form>

      <p className="mt-6 text-center text-xs text-secondary">Already have an account? <Link to="/login" className="font-semibold text-accent hover:text-accent-hover">Sign in</Link></p>
    </AuthPageLayout>
  );
}

export default SignupPage;
