import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail } from 'lucide-react';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/useAuth';
import { authErrorMessage } from '../lib/auth';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (result.error) {
      setError(authErrorMessage(result.error));
      return;
    }

    navigate('/overview', { replace: true });
  };

  return (
    <AuthPageLayout>
      <div className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Welcome back</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[30px]">Sign in to Finexy</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">Continue managing your personal finances with your secure account.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && <p role="alert" className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs font-semibold leading-relaxed text-danger">{error}</p>}
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-primary">Email address</label>
          <Input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-primary">Password</label>
          <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" leftIcon={<LockKeyhole className="h-4 w-4" />} />
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</Button>
      </form>

      <p className="mt-6 text-center text-xs text-secondary">New to Finexy? <Link to="/signup" className="font-semibold text-accent hover:text-accent-hover">Create an account</Link></p>
    </AuthPageLayout>
  );
}

export default LoginPage;
