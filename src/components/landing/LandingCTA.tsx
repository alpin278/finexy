import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

export function LandingCTA() {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="scroll-reveal relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12 lg:p-16 shadow-elevated text-center">
          {/* Subtle Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/15 blur-[100px] rounded-full"
          />

          <div className="relative mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 shadow-xs mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                GET STARTED WITH FINEXY
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary leading-tight">
              Ready to take command{' '}
              <span className="text-accent">
                of your finances?
              </span>
            </h2>

            <p className="mt-5 text-base sm:text-lg text-secondary leading-relaxed">
              Finexy gives you clear visibility into your spending, budgets, and wallets. Set up your wallets, budgets, and preferences in one place.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full sm:w-auto font-semibold px-8 shadow-md hover:shadow-lg hover:shadow-accent/20"
                  rightIcon={<Icon name="arrow-right" className="text-sm font-bold" />}
                >
                  Get Started Free
                </Button>
              </Link>

              <a href="#overview" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto font-semibold px-8 border-border bg-surface/90"
                  leftIcon={<Icon name="eye" className="text-sm" />}
                >
                  Explore Live Preview
                </Button>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-secondary font-medium">
              <span className="flex items-center gap-1.5">
                <Icon name="check2" className="text-success text-xs shrink-0" />
                No bank passwords needed
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="check2" className="text-success text-xs shrink-0" />
                Free plan available
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="check2" className="text-success text-xs shrink-0" />
                Data export anytime
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
