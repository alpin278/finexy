import { Icon } from '../ui/Icon';

export function BudgetCurrencySection() {
  const wallets = [
    {
      id: 'bca',
      title: 'Main Bank (IDR)',
      badge: 'Base Currency',
      original: 'Rp24,451,123',
      rate: 'Base Currency',
      converted: 'Rp24,451,123',
      icon: 'bank',
      type: 'Checking Wallet',
      tagColor: 'bg-primary/10 text-primary',
    },
    {
      id: 'wise',
      title: 'USD Stash',
      badge: 'Foreign Currency · USD',
      original: '$3,450.50',
      rate: '1 USD ≈ Rp15,500',
      converted: 'Rp53,482,750',
      icon: 'currency-dollar',
      type: 'Savings Wallet',
      tagColor: 'bg-accent/10 text-accent',
    },
    {
      id: 'revolut',
      title: 'EUR Travel Wallet',
      badge: 'Foreign Currency · EUR',
      original: '€720.00',
      rate: '1 EUR ≈ Rp17,000',
      converted: 'Rp12,240,000',
      icon: 'currency-euro',
      type: 'Travel Pocket',
      tagColor: 'bg-success/10 text-success',
    },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="scroll-reveal text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 shadow-xs mb-3">
            <Icon name="globe" className="text-accent text-sm" />
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              MULTI-CURRENCY & WALLETS
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-primary">
            Different wallets.{' '}
            <span className="text-accent">One clear picture.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-secondary">
            Hold Indonesian Rupiah, US Dollars, and Euros concurrently. Finexy values your cross-currency balances into a single consolidated net worth using reference exchange rates.
          </p>
        </div>

        {/* 3 Wallet Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {wallets.map((wallet, index) => (
            <div
              key={wallet.id}
              className={`scroll-reveal stagger-${index + 1} rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col justify-between transition-[box-shadow,border-color] duration-200 hover:border-border-hover hover:shadow-elevated`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${wallet.tagColor}`}
                  >
                    <Icon name={wallet.icon} className="text-lg" />
                  </div>
                  <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider rounded-full border border-border bg-surface px-2.5 py-0.5">
                    {wallet.type}
                  </span>
                </div>

                <h3 className="text-base font-bold text-primary">{wallet.title}</h3>
                <div className="mt-3">
                  <span className="text-2xl font-bold tracking-tight text-primary">
                    {wallet.original}
                  </span>
                  <span className="block text-xs text-secondary mt-0.5">{wallet.badge}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/80 space-y-1 text-xs">
                <div className="flex items-center justify-between text-secondary">
                  <span>Valuation Rate</span>
                  <span className="font-medium text-primary">{wallet.rate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary font-medium">Consolidated Value</span>
                  <span className="font-bold text-primary">{wallet.converted}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Consolidated Total Bar */}
        <div className="mt-8 rounded-2xl border border-border bg-surface/80 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-xs">
              <Icon name="calculator" className="text-base" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Consolidated Net Worth
              </p>
              <p className="text-xl sm:text-2xl font-black tracking-tight text-primary">
                Rp90,173,873
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-secondary">
            <Icon name="check-circle-fill" className="text-success text-sm" />
            <span>Multi-currency reference rate valuation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
