import { Icon } from '../ui/Icon';
import { StatusBadge } from '../ui/StatusBadge';

export function TelegramSection() {
  return (
    <section id="telegram" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="scroll-reveal text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 shadow-xs mb-3">
            <Icon name="telegram" className="text-accent text-sm" />
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              FRICTIONLESS INPUT VIA BOT
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-primary">
            Record expenses in 3 seconds,{' '}
            <span className="text-accent">right from Telegram.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-secondary">
            Never lose a cash or dinner expense again. Simply send a short message to your private bot—no heavy app launches required.
          </p>
        </div>

        {/* Visual Sync Demonstration */}
        <div className="scroll-reveal stagger-1 relative rounded-2xl sm:rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-elevated overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Realistic Telegram Chat Interface (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-border bg-surface/90 p-4 sm:p-5 shadow-card flex flex-col justify-between h-[360px]">
              {/* Telegram Chat Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white font-bold text-sm shadow-xs">
                  <Icon name="send-fill" className="text-base" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
                    Finexy Bot
                    <span className="inline-block h-2 w-2 rounded-full bg-success" />
                  </h4>
                  <p className="text-[11px] text-secondary">bot · always active</p>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="space-y-3.5 my-auto py-2">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-primary text-canvas px-4 py-2.5 shadow-xs">
                    <p className="text-xs sm:text-sm font-medium">Dinner with team Rp450.000</p>
                    <span className="block text-[10px] text-secondary text-right mt-1">20:41 · Read</span>
                  </div>
                </div>

                {/* Bot Reply */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-tl-xs border border-border bg-card text-primary px-4 py-3 shadow-card space-y-1.5">
                    <div className="flex items-center gap-1.5 text-success text-xs font-bold">
                      <Icon name="check2-circle" className="text-sm" />
                      <span>Transaction Logged</span>
                    </div>
                    <div className="text-xs space-y-0.5 text-secondary">
                      <p><strong className="text-primary">Dining & Food</strong> · Rp450,000</p>
                      <p>Account: <span className="font-semibold text-primary">Main Bank</span></p>
                      <p>Budget: <span className="text-warning font-semibold">82.4% spent</span> (Near Limit)</p>
                    </div>
                    <span className="block text-[10px] text-muted mt-1">20:41</span>
                  </div>
                </div>
              </div>

              {/* Message Input Box Mock */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/80">
                <div className="flex-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted">
                  Type a quick transaction...
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                  <Icon name="arrow-up-short" className="text-lg" />
                </div>
              </div>
            </div>

            {/* Middle Sync Indicator (2 cols on lg) */}
            <div className="hidden lg:flex lg:col-span-2 flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface shadow-xs text-accent">
                <Icon name="arrow-right" className="text-lg" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success">
                  Logged
                </span>
                <p className="text-[11px] text-secondary mt-1">To your account</p>
              </div>
            </div>

            {/* Right: Finexy Ledger Live Row (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-border bg-surface/90 p-4 sm:p-5 shadow-card flex flex-col justify-between h-[360px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <Icon name="journal-bookmark-fill" className="text-accent text-sm" />
                    <h4 className="text-sm font-bold text-primary">Finexy Ledger</h4>
                  </div>
                  <span className="text-[11px] font-semibold text-secondary">Live stream</span>
                </div>

                <div className="mt-4 space-y-3">
                  {/* Top Highlighted Synced Row */}
                  <div className="rounded-xl border border-accent/40 bg-card p-3.5 shadow-sm transition-all duration-200 ring-2 ring-accent/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                          <Icon name="cup-hot" className="text-sm" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary">Dinner with team</p>
                          <p className="text-[11px] text-secondary">Dining & Food · Main Bank</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-accent">-Rp450,000</p>
                        <p className="text-[10px] text-muted">Just now</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/60 text-[10px]">
                      <span className="text-secondary font-medium">Source: Telegram Bot</span>
                      <StatusBadge status="completed" label="Reconciled" />
                    </div>
                  </div>

                  {/* Previous Row */}
                  <div className="rounded-xl border border-border/80 bg-card/60 p-3 opacity-75">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-secondary border border-border">
                          <Icon name="cart" className="text-sm" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-primary">Weekly Supermarket</p>
                          <p className="text-[11px] text-secondary">Groceries · Cash Pocket</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-primary">-Rp185,000</p>
                        <p className="text-[10px] text-muted">Yesterday</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bot Security Pledge */}
              <div className="pt-3 border-t border-border/80 flex items-center gap-2 text-xs text-secondary">
                <Icon name="shield-lock-fill" className="text-success text-sm shrink-0" />
                <span>Connected directly to your personal Finexy account.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
