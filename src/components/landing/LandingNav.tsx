import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/useTheme';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export function LandingNav() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Overview', href: '#overview' },
    { label: 'Features', href: '#features' },
    { label: 'Telegram Entry', href: '#telegram' },
    { label: 'Statement Import', href: '#statement' },
    { label: 'Security', href: '#security' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          to="/landing-preview"
          className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-lg p-1"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            <span className="text-sm font-extrabold tracking-tight">F</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-primary">
            FINEXY
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/80 bg-surface/70 px-4 py-1.5 shadow-xs">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-3.5 py-1 text-xs font-medium text-secondary transition-colors duration-150 hover:text-primary hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action Buttons & Theme Toggle */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Radial Theme Toggle */}
          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-secondary transition-[background-color,border-color,color,transform] duration-150 hover:border-border-hover hover:bg-card hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <span
              className={cn(
                'inline-flex transition-transform duration-200 ease-out',
                theme === 'dark' ? 'rotate-[30deg] text-warning' : 'rotate-0 text-secondary'
              )}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="text-sm" />
            </span>
          </button>

          <Link to="/login">
            <Button variant="ghost" size="sm" className="font-semibold text-xs text-primary hover:text-primary">
              Sign In
            </Button>
          </Link>

          <Link to="/signup">
            <Button variant="accent" size="sm" className="font-semibold text-xs shadow-xs">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-secondary hover:text-primary active:scale-95"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="text-sm" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-secondary hover:text-primary active:scale-95"
          >
            <Icon name={mobileMenuOpen ? 'x-lg' : 'list'} className="text-base" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border bg-surface/95 backdrop-blur-md px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-card"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-3 border-t border-border">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" fullWidth size="md">
                Sign In
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="accent" fullWidth size="md">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
