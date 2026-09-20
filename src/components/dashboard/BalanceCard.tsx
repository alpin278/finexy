import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { formatWalletAmount } from '../../lib/overview';
import type { WalletCurrencyCode } from '../../types/finance';

export interface BalanceCardProps { amount: number; currency: WalletCurrencyCode; period: string; className?: string; }

export function BalanceCard({ amount, currency, period, className }: BalanceCardProps) {
  return <Card className={cn('relative flex flex-col justify-between overflow-hidden p-5 sm:p-6', className)}><div className="flex items-center justify-between"><span className="text-xs font-semibold text-secondary sm:text-sm">Total Balance</span><span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary">{currency}</span></div><div className="my-4"><h2 className="font-sans text-3xl font-bold leading-none tracking-tight text-primary sm:text-[34px] lg:text-[38px]">{formatWalletAmount(amount, currency)}</h2><div className="mt-2.5 flex items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success"><i className="bi bi-wallet2" aria-hidden="true" />Settled</span><span className="text-xs text-secondary">Active wallets only</span></div></div><div className="mt-4 border-t border-border/60 pt-3 text-[11px] text-secondary">{currency} reporting currency · {period}</div></Card>;
}

export default BalanceCard;
