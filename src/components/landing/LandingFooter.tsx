import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';

export function LandingFooter() {
  return (
    <footer className="scroll-reveal border-t border-border bg-surface/60 pt-12 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border/80">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white font-extrabold text-sm shadow-xs">
                F
              </div>
              <span className="text-lg font-bold tracking-tight text-primary">
                FINEXY
              </span>
            </div>
            <p className="max-w-sm text-xs sm:text-sm text-secondary leading-relaxed">
              Personal finance tracker built for transaction logging, multi-currency valuation, and data privacy.
            </p>
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span>All systems operational · PostgreSQL RLS</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-secondary">
              <li>
                <a href="#overview" className="hover:text-primary transition-colors">
                  Overview Cockpit
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  Features & Bento
                </a>
              </li>
              <li>
                <a href="#telegram" className="hover:text-primary transition-colors">
                  Telegram Bot Input
                </a>
              </li>
              <li>
                <a href="#statement" className="hover:text-primary transition-colors">
                  Statement Import
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-primary transition-colors">
                  Privacy & Security
                </a>
              </li>
            </ul>
          </div>

          {/* Account & Access */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
              Access
            </h4>
            <ul className="space-y-2 text-xs text-secondary">
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Sign In to Dashboard
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-primary transition-colors">
                  Create New Account
                </Link>
              </li>
              <li>
                <Link to="/overview" className="hover:text-primary transition-colors">
                  Direct Cockpit Preview
                </Link>
              </li>
              {import.meta.env.DEV && (
                <li>
                  <Link to="/loading-preview" className="hover:text-primary transition-colors">
                    Splash Screen Preview
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary">
          <p>© 2026 Finexy. Crafted with precision for personal financial clarity.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Icon name="shield-check" className="text-success text-xs" />
              Private user data
            </span>
            <span className="flex items-center gap-1">
              <Icon name="lock" className="text-xs" />
              No bank passwords needed
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
