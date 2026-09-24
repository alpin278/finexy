import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

export function ImportAnalyticsSection() {
  const steps = [
    {
      num: '01',
      title: 'Export & Drop',
      desc: 'Export a standard CSV file from your bank or financial provider. Upload it directly into Finexy to preview and match columns.',
      icon: 'cloud-arrow-up',
    },
    {
      num: '02',
      title: 'Column Matching',
      desc: 'Detect dates, amounts, debit/credit polarity, and map entries cleanly to your existing categories.',
      icon: 'magic',
    },
    {
      num: '03',
      title: 'Reconcile & Commit',
      desc: 'Built-in duplicate checking flags existing entries. Review the batch, make quick category adjustments, and commit in one click.',
      icon: 'check2-all',
    },
  ];

  return (
    <section id="statement" className="scroll-mt-20 py-16 sm:py-24 bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="scroll-reveal text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 shadow-xs mb-3">
            <Icon name="file-earmark-spreadsheet" className="text-primary text-sm" />
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              STATEMENT RECONCILIATION
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-primary">
            Bank statement import with{' '}
            <span className="text-accent">clean reconciliation.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-secondary">
            Import standard CSV statement files directly, previewing and committing transactions without manual re-entry.
          </p>
        </div>

        {/* Two-Column Layout: Steps on Left, Interactive Import Card on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Steps (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.num}
                className={`scroll-reveal stagger-${index + 1} flex items-start gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card transition-all duration-200 hover:border-border-hover`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary flex items-center gap-2">
                    {step.title}
                    <Icon name={step.icon} className="text-secondary text-sm" />
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-secondary leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Import Card Preview (7 Cols) */}
          <div className="scroll-reveal stagger-2 lg:col-span-7 rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-elevated">
            {/* File Staging Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                  <Icon name="filetype-csv" className="text-xl" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary">statement_june_2026.csv</h4>
                  <p className="text-[11px] text-secondary">42 KB · 48 rows detected · 0 duplicates</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                <Icon name="check-circle-fill" className="text-xs" />
                100% Matched
              </span>
            </div>

            {/* Parsed Rows Sample */}
            <div className="my-4 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-surface/50">
              <div className="flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold text-secondary uppercase tracking-wider bg-surface">
                <span>Date & Payee</span>
                <span>Category</span>
                <span className="text-right">Amount</span>
              </div>

              <div className="flex items-center justify-between px-4 py-3 text-xs">
                <div>
                  <p className="font-semibold text-primary">Kopi Kenangan Senopati</p>
                  <p className="text-[11px] text-secondary">24 Jun 2026 · Card Debit</p>
                </div>
                <div>
                  <span className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-medium text-secondary border border-border">
                    Dining & Food
                  </span>
                </div>
                <div className="text-right font-bold text-accent">
                  -Rp45,000
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3 text-xs">
                <div>
                  <p className="font-semibold text-primary">Client Transfer Studio UX</p>
                  <p className="text-[11px] text-secondary">23 Jun 2026 · Wire Transfer</p>
                </div>
                <div>
                  <span className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-medium text-secondary border border-border">
                    Client Retainer
                  </span>
                </div>
                <div className="text-right font-bold text-success">
                  +Rp3,500,000
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3 text-xs">
                <div>
                  <p className="font-semibold text-primary">Biznet Fiber Home 100M</p>
                  <p className="text-[11px] text-secondary">21 Jun 2026 · Autopay</p>
                </div>
                <div>
                  <span className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-medium text-secondary border border-border">
                    Utilities
                  </span>
                </div>
                <div className="text-right font-bold text-accent">
                  -Rp385,000
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
              <span className="text-xs text-secondary">
                Assigned to <strong className="text-primary font-semibold">Main Bank Account</strong>
              </span>
              <Button
                variant="accent"
                size="md"
                className="w-full sm:w-auto font-semibold shadow-xs"
                leftIcon={<Icon name="check2" className="text-sm font-bold" />}
              >
                Commit 48 Transactions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
