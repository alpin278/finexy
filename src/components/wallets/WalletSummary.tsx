import { Card } from '../ui/Card';
import type { Wallet } from '../../types/finance';

export function WalletSummary({ wallets }: { wallets: Wallet[] }) {
  const active = wallets.filter((wallet) => wallet.status === 'Active').length;
  // The primary account limit mirrors the three currency wallets in Overview.
  // Cash and card payment sources retain their own usage limits on their cards.
  const totalLimit = wallets
    .filter((wallet) => wallet.type !== 'cash' && wallet.type !== 'card')
    .reduce((sum, wallet) => sum + wallet.monthlyLimit, 0);
  const stats = [
    ['Total Balance', '$689,372.00'],
    ['Total Wallets', String(wallets.length)],
    ['Active Wallets', String(active)],
    ['Monthly Limit', `$${totalLimit.toLocaleString()}.00`],
  ];
  return <section aria-label="Wallet summary" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
    {stats.map(([label, value]) => <Card key={label} padding="sm" className="min-w-0">
      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] font-semibold text-secondary">{label}</p>
      <p className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-primary truncate">{value}</p>
    </Card>)}
  </section>;
}
