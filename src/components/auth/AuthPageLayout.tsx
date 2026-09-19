import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-canvas px-4 py-8 font-sans antialiased text-primary sm:px-6">
      <div className="w-full max-w-md">
        <Link to="/login" className="mx-auto mb-6 flex w-fit items-center gap-2.5" aria-label="Finexy home">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-white shadow-xs">F</span>
          <span className="text-xl font-bold tracking-tight">Finexy</span>
        </Link>
        <section className="rounded-[28px] border border-border bg-white p-5 shadow-[0_16px_50px_-20px_rgba(0,0,0,0.16)] sm:p-8">
          {children}
        </section>
        <p className="mt-5 text-center text-[11px] text-secondary">Personal finance, kept simple and private.</p>
      </div>
    </main>
  );
}
