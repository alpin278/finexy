import { Card } from '../ui/Card';
import { formatWalletAmount } from '../../lib/wallets';
import type { Wallet } from '../../types/finance';

function mixedCurrencyValue(wallets: Wallet[], values: (wallet: Wallet) => number) {
  const currencies = [...new Set(wallets.map((wallet) => wallet.currency))];
  if (currencies.length !== 1) return wallets.length ? 'Mixed currencies' : '—';
  return formatWalletAmount(wallets.reduce((sum, wallet) => sum + values(wallet), 0), currencies[0]);
}

export function WalletSummary({ wallets }: { wallets: Wallet[] }) {
  const active = wallets.filter((wallet) => wallet.status === 'Active').length;
  const stats = [
    ['Opening Balance Baseline', mixedCurrencyValue(wallets, (wallet) => wallet.balance)],
    ['Total Wallets', String(wallets.length)],
    ['Active Wallets', String(active)],
    ['Monthly Limit', mixedCurrencyValue(wallets, (wallet) => wallet.monthlyLimit ?? 0)],
  ];
  return <section aria-label="Wallet summary" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
    {stats.map(([label, value]) => <Card key={label} padding="sm" className="min-w-0"><p className="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] font-semibold text-secondary">{label}</p><p className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-primary truncate">{value}</p></Card>)}
  </section>;
}
