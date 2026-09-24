import { Icon } from '../ui/Icon';
import { StatusBadge } from '../ui/StatusBadge';

export function ProductShowcase() {
  return (
    <section id="overview" className="scroll-mt-20 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="scroll-reveal mb-6 sm:mb-8 text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            LIVE INTERACTIVE PREVIEW
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            Designed for financial command
          </h2>
          <p className="mt-1 text-sm sm:text-base text-secondary">
            A cohesive dashboard engineered for swift daily check-ins and monthly clarity.
          </p>
        </div>

        {/* Dashboard Shell Mockup */}
        <div className="scroll-reveal stagger-1 overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-elevated">
          {/* Mockup Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 sm:px-6 py-3.5">
            {/* Nav Route Pills */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-canvas shadow-xs">
                <Icon name="grid-1x2" className="text-xs" />
                Overview
              </span>
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-secondary hover:text-primary transition-colors">
                <Icon name="arrow-left-right" className="text-xs" />
                Transactions
              </span>
              <span className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-secondary hover:text-primary transition-colors">
                <Icon name="wallet2" className="text-xs" />
                Wallets
              </span>
              <span className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-secondary hover:text-primary transition-colors">
                <Icon name="pie-chart" className="text-xs" />
                Budgets
              </span>
              <span className="hidden md:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-secondary hover:text-primary transition-colors">
                <Icon name="bar-chart-line" className="text-xs" />
                Reports
              </span>
            </div>

            {/* Command Bar Dummy */}
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs text-secondary shadow-xs">
              <Icon name="search" className="text-xs" />
              <span>Search transactions or jump to...</span>
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono text-muted">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Mockup Cockpit Content */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-canvas/40">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                  Your financial overview
                </h3>
                <p className="text-xs sm:text-sm text-secondary">
                  Track your real net cash flow, cross-wallet balances, and spending limits.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium text-secondary shadow-xs">
                  <Icon name="calendar-date" className="text-xs" />
                  This Month (June 2026)
                </span>
              </div>
            </div>

            {/* 5 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {/* 1. Consolidated Balance */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-secondary mb-1.5">
                  <span className="font-medium">Total Balance</span>
                  <Icon name="wallet" className="text-accent text-sm" />
                </div>
                <div className="text-xl font-bold tracking-tight text-primary">
                  Rp2,451,123
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-success font-medium">
                  <Icon name="arrow-up-right" className="text-xs" />
                  <span>+12.4% vs last month</span>
                </div>
              </div>

              {/* 2. Monthly Spending */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-secondary mb-1.5">
                  <span className="font-medium">Monthly Spending</span>
                  <StatusBadge status="in_progress" label="Near Limit" />
                </div>
                <div className="text-xl font-bold tracking-tight text-primary">
                  Rp3,500,700
                </div>
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[11px] text-secondary mb-1">
                    <span>82.4% of budget</span>
                    <span className="font-semibold text-warning">Rp4,250,000 limit</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                    <div className="h-full rounded-full bg-warning" style={{ width: '82.4%' }} />
                  </div>
                </div>
              </div>

              {/* 3. Monthly Income */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-secondary mb-1.5">
                  <span className="font-medium">Monthly Income</span>
                  <Icon name="graph-up-arrow" className="text-success text-sm" />
                </div>
                <div className="text-xl font-bold tracking-tight text-primary">
                  Rp9,000,000
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-success font-medium">
                  <Icon name="arrow-up-right" className="text-xs" />
                  <span>+5.2% vs regular</span>
                </div>
              </div>

              {/* 4. Net Cash Flow */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-secondary mb-1.5">
                  <span className="font-medium">Net Cash Flow</span>
                  <StatusBadge status="completed" label="Positive" />
                </div>
                <div className="text-xl font-bold tracking-tight text-success">
                  +Rp5,499,300
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-secondary font-medium">
                  <span>Inflow exceeds outflow</span>
                </div>
              </div>

              {/* 5. Savings Rate */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between text-xs text-secondary mb-1.5">
                  <span className="font-medium">Savings Rate</span>
                  <Icon name="piggy-bank" className="text-accent text-sm" />
                </div>
                <div className="text-xl font-bold tracking-tight text-primary">
                  61.1%
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-success font-medium">
                  <Icon name="check2-circle" className="text-xs" />
                  <span>Target 50% reached</span>
                </div>
              </div>
            </div>

            {/* Split Lower View: Wallets Summary & Cash Flow Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Wallets Summary Card (5 Cols) */}
              <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-primary">Your Wallets</h4>
                  <span className="text-[11px] font-semibold text-secondary">3 accounts</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-border/70 bg-surface/60 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                        <Icon name="bank" className="text-sm" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary">Main Bank Account</p>
                        <p className="text-[11px] text-secondary">Checking · IDR</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">Rp1,450,000</p>
                      <p className="text-[10px] text-success font-medium">Active</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border/70 bg-surface/60 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent font-bold text-xs">
                        $
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary">USD Wallet</p>
                        <p className="text-[11px] text-secondary">Multi-currency · USD</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">$570.00</p>
                      <p className="text-[10px] text-secondary font-medium">≈ Rp9,120,000</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border/70 bg-surface/60 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-secondary border border-border font-bold text-xs">
                        <Icon name="cash" className="text-sm" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary">Cash Pocket</p>
                        <p className="text-[11px] text-secondary">Physical Cash · IDR</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">Rp120,500</p>
                      <p className="text-[10px] text-secondary font-medium">Manual ledger</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cash Flow Trends Card (7 Cols) */}
              <div className="lg:col-span-7 rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-primary">Cash Flow Trends</h4>
                      <p className="text-[11px] text-secondary">Income vs Expenses (Jan – Jun)</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-success" />
                        <span className="text-secondary text-[11px]">Income</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-accent" />
                        <span className="text-secondary text-[11px]">Expense</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Comparison Columns */}
                  <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-36 pt-4 pb-2 border-b border-border/80">
                    {[
                      { month: 'Jan', inc: 75, exp: 45 },
                      { month: 'Feb', inc: 80, exp: 50 },
                      { month: 'Mar', inc: 70, exp: 62 },
                      { month: 'Apr', inc: 90, exp: 55 },
                      { month: 'May', inc: 85, exp: 48 },
                      { month: 'Jun', inc: 95, exp: 38 },
                    ].map((bar) => (
                      <div key={bar.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="flex items-end gap-1 w-full justify-center h-full">
                          <div
                            className="w-2.5 sm:w-4 bg-success/80 rounded-t-sm transition-all duration-300 hover:bg-success"
                            style={{ height: `${bar.inc}%` }}
                            title={`Income: ${bar.inc}%`}
                          />
                          <div
                            className="w-2.5 sm:w-4 bg-accent/80 rounded-t-sm transition-all duration-300 hover:bg-accent"
                            style={{ height: `${bar.exp}%` }}
                            title={`Expense: ${bar.exp}%`}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-secondary">{bar.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-secondary">
                  <span>Average monthly savings rate: <strong className="text-primary font-semibold">58.4%</strong></span>
                  <span className="text-success font-semibold flex items-center gap-1">
                    <Icon name="shield-check" className="text-xs" />
                    Healthy Margin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
