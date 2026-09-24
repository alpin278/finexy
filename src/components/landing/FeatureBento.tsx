import { Icon } from '../ui/Icon';

export function FeatureBento() {
  const features = [
    {
      id: 'pipeline',
      title: 'Transaction Pipeline',
      description:
        'Fast capture, multi-account routing, and automatic status tracking with zero cumbersome clicks.',
      icon: 'lightning-charge',
      accentColor: 'text-accent',
      accentBg: 'bg-accent/10',
      badge: 'Lightning Fast',
      tagline: 'Log in under 5 seconds',
      highlight: 'Auto-categorization & tagging',
    },
    {
      id: 'scanner',
      title: 'Bank Statement Import',
      description:
        'Upload bank statement CSV files to preview, match columns, and commit staged entries to your ledger.',
      icon: 'file-earmark-spreadsheet',
      accentColor: 'text-primary',
      accentBg: 'bg-primary/10',
      badge: 'CSV Import',
      tagline: 'Staged reconciliation',
      highlight: 'Duplicate protection',
    },
    {
      id: 'pacing',
      title: 'Budget Pacing Engine',
      description:
        'Dynamic category thresholds with On Track (<80%), Near Limit (80–99%), and Over Budget flags.',
      icon: 'pie-chart',
      accentColor: 'text-warning',
      accentBg: 'bg-warning/10',
      badge: 'Smart Pacing',
      tagline: 'Proactive spend guards',
      highlight: 'Pacing warnings at 80%',
    },
    {
      id: 'recurring',
      title: 'Recurring Transactions',
      description:
        'Track fixed commitments, scheduled recurring payments, and utility bills before due dates arrive.',
      icon: 'arrow-repeat',
      accentColor: 'text-success',
      accentBg: 'bg-success/10',
      badge: 'Scheduled Entries',
      tagline: 'Planned commitments',
      highlight: 'Keep tabs on recurring bills',
    },
    {
      id: 'multicurrency',
      title: 'Multi-Currency Valuation',
      description:
        'Hold IDR, USD, EUR, and GBP accounts concurrently. View your consolidated net worth valued in your chosen reporting currency.',
      icon: 'cash-stack',
      accentColor: 'text-accent',
      accentBg: 'bg-accent/10',
      badge: 'Global Wallets',
      tagline: 'Rp · $ · € · £',
      highlight: 'Consolidated currency valuation',
    },
    {
      id: 'split',
      title: 'Split Transactions',
      description:
        'Divide a single supermarket or grocery receipt across groceries, home goods, and personal care seamlessly.',
      icon: 'distribute-vertical',
      accentColor: 'text-primary',
      accentBg: 'bg-primary/10',
      badge: 'Multi-Category',
      tagline: 'Precision ledger',
      highlight: 'Fractional allocation support',
    },
  ];

  return (
    <section id="features" className="scroll-mt-20 py-16 sm:py-24 bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="scroll-reveal text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 shadow-xs mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              CORE CAPABILITIES
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-primary">
            Everything your money touches,{' '}
            <span className="text-accent">organized with intention.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-secondary">
            Every tool in Finexy is built around real personal finance habits, not bureaucratic enterprise accounting.
          </p>
        </div>

        {/* 6 Bento Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`scroll-reveal stagger-${index + 1} group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-card transition-[box-shadow,border-color] duration-200 hover:border-border-hover hover:shadow-elevated`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.accentBg} ${feature.accentColor} transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon name={feature.icon} className="text-lg" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary rounded-full border border-border bg-surface px-2.5 py-0.5">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold tracking-tight text-primary group-hover:text-accent transition-colors duration-150">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-xs">
                <span className="font-semibold text-primary">{feature.tagline}</span>
                <span className="text-secondary flex items-center gap-1">
                  <Icon name="check2" className="text-success font-bold" />
                  {feature.highlight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
