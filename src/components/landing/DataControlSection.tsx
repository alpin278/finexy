import { Icon } from '../ui/Icon';

export function DataControlSection() {
  const pillars = [
    {
      title: 'No Fund Custody',
      description:
        'Finexy is a personal finance tracker that does not hold or move your money. We never ask for online banking passwords, credentials, or transaction PINs.',
      icon: 'shield-lock',
      tag: 'Tracker Only',
    },
    {
      title: 'One-Click Data Export',
      description:
        'Your records belong to you. Download your complete transaction ledger, budgets, and wallet histories in standard CSV or JSON anytime.',
      icon: 'download',
      tag: 'Export Anytime',
    },
    {
      title: 'PostgreSQL Row-Level Security',
      description:
        'Database rows are protected by PostgreSQL Row Level Security (RLS), restricting data access strictly to your authenticated account.',
      icon: 'database-lock',
      tag: 'Account Isolation',
    },
  ];

  return (
    <section id="security" className="scroll-mt-20 py-16 sm:py-24 bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="scroll-reveal text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 shadow-xs mb-3">
            <Icon name="lock-fill" className="text-success text-sm" />
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              DATA PRIVACY & CONTROL
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-primary">
            Your financial history{' '}
            <span className="text-accent">should stay yours.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-secondary">
            No bank passwords required, no third-party data broker partnerships, and private user financial data.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.title}
              className={`scroll-reveal stagger-${index + 1} flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card transition-[box-shadow,border-color] duration-200 hover:border-border-hover hover:shadow-elevated`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface border border-border text-primary shadow-xs">
                    <Icon name={pillar.icon} className="text-xl text-primary" />
                  </div>
                  <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider rounded-full border border-border bg-surface px-2.5 py-0.5">
                    {pillar.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold tracking-tight text-primary">
                  {pillar.title}
                </h3>
                <p className="mt-2.5 text-sm text-secondary leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/70 flex items-center gap-2 text-xs font-semibold text-success">
                <Icon name="check-circle-fill" className="text-sm" />
                <span>Database isolation & export</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
