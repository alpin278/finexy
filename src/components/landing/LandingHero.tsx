import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

export function LandingHero() {
  return (
    <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32 overflow-hidden">
      {/* Subtle background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] sm:w-[900px] sm:h-[450px] bg-accent/8 blur-[120px] rounded-full"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Overline Badge */}
        <div className="hero-reveal inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 shadow-xs mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <span className="text-xs font-semibold tracking-wider uppercase text-secondary">
            ALL-IN-ONE FINANCIAL COCKPIT
          </span>
        </div>

        {/* Primary Heading */}
        <h1 className="hero-reveal hero-delay-1 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-primary leading-[1.08] sm:leading-[1.06]">
          Your money,{' '}
          <span className="text-accent">
            finally in one place.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-reveal hero-delay-2 mx-auto mt-6 max-w-2xl text-base sm:text-lg lg:text-xl text-secondary leading-relaxed font-normal">
          From everyday spending reconciliation to multi-currency valuation, Finexy transforms tangled
          receipts and accounts into precision financial clarity. Zero bank passwords required.
        </p>

        {/* Action Buttons */}
        <div className="hero-reveal hero-delay-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button
              variant="accent"
              size="lg"
              className="w-full sm:w-auto font-semibold px-7 shadow-md hover:shadow-lg hover:shadow-accent/20"
              rightIcon={<Icon name="arrow-right" className="text-sm font-bold" />}
            >
              Get Started Free
            </Button>
          </Link>

          <a href="#overview" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto font-semibold px-7 border-border/80 bg-surface/90"
              leftIcon={<Icon name="eye" className="text-sm" />}
            >
              Explore Live Preview
            </Button>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="hero-reveal hero-delay-4 mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-medium text-secondary">
          <div className="flex items-center gap-2">
            <Icon name="shield-check" className="text-success text-base" />
            <span>Private by design</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="currency-exchange" className="text-accent text-base" />
            <span>Multi-currency native (IDR & USD)</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="file-earmark-spreadsheet" className="text-primary text-base" />
            <span>Statement reconciliation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
