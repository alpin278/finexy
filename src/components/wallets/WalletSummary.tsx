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
  const balance = mixedCurrencyValue(wallets, (wallet) => wallet.balance);
  const monthlyLimit = mixedCurrencyValue(wallets, (wallet) => wallet.monthlyLimit ?? 0);
  const stats = [
    ['Current Balance', balance],
    ['Total Wallets', String(wallets.length)],
    ['Active Wallets', String(active)],
    ['Monthly Limit', monthlyLimit],
  ];
  return <section aria-label="Wallet summary">
    <Card padding="none" className="p-4 sm:hidden">
      <p className="money-value value-change truncate text-2xl font-bold tracking-tight text-primary">{balance}</p>
      <p className="mt-1 text-xs text-secondary">Total balance</p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs"><span className="font-semibold text-primary">{active} active wallet{active === 1 ? '' : 's'}</span><span className="truncate text-secondary">Monthly limit {monthlyLimit}</span></div>
    </Card>
    <div className="hidden grid-cols-1 gap-3 sm:grid sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {stats.map(([label, value]) => <Card key={label} padding="sm" className="min-w-0"><p className="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] font-semibold text-secondary">{label}</p><p className={label === 'Current Balance' || label === 'Monthly Limit' ? 'money-value value-change mt-2 truncate text-lg font-bold tracking-tight text-primary sm:text-xl' : 'mt-2 truncate text-lg font-bold tracking-tight text-primary sm:text-xl'}>{value}</p></Card>)}
    </div>
  </section>;
}
