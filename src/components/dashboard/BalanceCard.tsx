import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { formatWalletAmount } from '../../lib/overview';
import type { WalletCurrencyCode } from '../../types/finance';
import { AmountValue } from '../ui/AmountValue';

export interface BalanceCardProps {
  amount: number;
  currency: WalletCurrencyCode;
  period: string;
  className?: string;
}

export function BalanceCard({ amount, currency, period, className }: BalanceCardProps) {
  return (
    <Card className={cn('relative flex min-w-0 flex-col justify-between overflow-hidden p-5 sm:p-6', className)}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="truncate text-xs font-semibold text-secondary sm:text-sm">Total Balance</span>
        <span className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary">{currency}</span>
      </div>
      <div className="my-4 min-w-0">
        <h2><AmountValue value={formatWalletAmount(amount, currency)} className="font-sans text-[clamp(1.55rem,2.5vw,2.35rem)] font-bold leading-tight tracking-[-0.04em] text-primary" /></h2>
        <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success"><i className="bi bi-wallet2" aria-hidden="true" />Settled</span>
          <span className="text-xs text-secondary">Active wallets only</span>
        </div>
      </div>
      <div className="mt-4 border-t border-border/60 pt-3 text-[11px] text-secondary">{currency} reporting currency <span aria-hidden="true">·</span> {period}</div>
    </Card>
  );
}

export default BalanceCard;
