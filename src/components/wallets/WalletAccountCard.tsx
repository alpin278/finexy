import type { Wallet } from '../../types/finance';
import { formatWalletAmount } from '../../lib/wallets';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusBadge } from '../ui/StatusBadge';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/Icon';

export interface WalletAccountCardProps { wallet: Wallet; menuOpen: boolean; onToggleMenu: () => void; onView: () => void; onEdit: () => void; onSetLimit: () => void; onDelete: () => void; }
const typeLabels: Record<NonNullable<Wallet['type']>, string> = { bank: 'Bank account', cash: 'Cash', card: 'Payment card', travel: 'Travel', savings: 'Savings' };

export function WalletAccountCard({ wallet, menuOpen, onToggleMenu, onView, onEdit, onSetLimit, onDelete }: WalletAccountCardProps) {
  const spent = wallet.spentThisMonth ?? 0;
  const usage = wallet.monthlyLimit ? Math.round((spent / wallet.monthlyLimit) * 100) : 0;
  return <Card padding="md" hoverable className="relative min-w-0 flex flex-col gap-5">
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-lg', wallet.colorVariant === 'accent' ? 'bg-accent/10 text-accent' : wallet.colorVariant === 'dark' ? 'bg-dark text-white border-dark' : 'bg-surface text-secondary')}><Icon name={wallet.type === 'cash' ? 'cash-stack' : wallet.type === 'card' ? 'credit-card' : wallet.type === 'savings' ? 'piggy-bank' : 'bank'} /></div><div className="min-w-0"><p className="text-sm font-bold text-primary truncate">{wallet.name}</p><p className="mt-0.5 text-xs text-secondary truncate">{typeLabels[wallet.type ?? 'bank']}{wallet.accountMask ? ` · ${wallet.accountMask}` : ''}</p></div></div><div className="relative shrink-0"><IconButton type="button" size="sm" variant="ghost" aria-label={`Actions for ${wallet.name}`} aria-expanded={menuOpen} onClick={onToggleMenu}><Icon name="three-dots" /></IconButton>{menuOpen && <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-border bg-white py-1 shadow-lg menu-enter"><button type="button" onClick={onView} className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">View Details</button><button type="button" onClick={onEdit} className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">Edit</button><button type="button" onClick={onSetLimit} className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">Set Limit</button><button type="button" onClick={onDelete} className="w-full px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger/10">Archive</button></div>}</div></div>
    <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">Current balance</p><p className="mt-1 text-2xl font-bold tracking-tight text-primary">{formatWalletAmount(wallet.balance, wallet.currency)}</p></div>
    <div className="space-y-2"><div className="flex items-center justify-between gap-3 text-xs"><span className="text-secondary">Prototype monthly usage</span><span className="font-semibold text-primary whitespace-nowrap">{wallet.monthlyLimit === null ? 'No limit' : `${formatWalletAmount(spent, wallet.currency)} / ${formatWalletAmount(wallet.monthlyLimit, wallet.currency)}`}</span></div>{wallet.monthlyLimit !== null && <ProgressBar value={spent} max={wallet.monthlyLimit || 1} height="sm" aria-label={`${wallet.name} monthly usage: ${usage}%`} />}</div>
    <div className="flex items-center justify-between gap-3 border-t border-border pt-4"><span className="text-xs font-semibold text-secondary">{wallet.currency}</span><StatusBadge status={wallet.status === 'Active' ? 'active' : 'inactive'} label={wallet.status} className="text-[10px] py-0.5" /></div>
  </Card>;
}
