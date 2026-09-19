import { MoreHorizontal } from 'lucide-react';
import type { Wallet } from '../../types/finance';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusBadge } from '../ui/StatusBadge';
import { cn } from '../../lib/utils';

export interface WalletAccountCardProps {
  wallet: Wallet;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onView: () => void;
  onEdit: () => void;
  onSetLimit: () => void;
  onDelete: () => void;
}

const typeLabels: Record<NonNullable<Wallet['type']>, string> = {
  bank: 'Bank account', cash: 'Cash', card: 'Payment card', travel: 'Travel', savings: 'Savings',
};

export function WalletAccountCard({ wallet, menuOpen, onToggleMenu, onView, onEdit, onSetLimit, onDelete }: WalletAccountCardProps) {
  const spent = wallet.spentThisMonth ?? 0;
  const usage = wallet.monthlyLimit ? Math.round((spent / wallet.monthlyLimit) * 100) : 0;
  return (
    <Card padding="md" hoverable className="relative min-w-0 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full border border-border flex items-center justify-center text-lg shrink-0', wallet.colorVariant === 'accent' ? 'bg-accent/10' : wallet.colorVariant === 'dark' ? 'bg-dark text-white border-dark' : 'bg-surface')}>{wallet.flag}</div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary truncate">{wallet.name}</p>
            <p className="mt-0.5 text-xs text-secondary truncate">{typeLabels[wallet.type ?? 'bank']}{wallet.accountMask ? ` · ${wallet.accountMask}` : ''}</p>
          </div>
        </div>
        <div className="relative shrink-0">
          <IconButton type="button" size="sm" variant="ghost" aria-label={`Actions for ${wallet.name}`} aria-expanded={menuOpen} onClick={onToggleMenu}><MoreHorizontal className="w-4 h-4" /></IconButton>
          {menuOpen && <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-border bg-white py-1 shadow-lg">
            <button type="button" onClick={onView} className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">View Details</button>
            <button type="button" onClick={onEdit} className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">Edit</button>
            <button type="button" onClick={onSetLimit} className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">Set Limit</button>
            <button type="button" onClick={onDelete} className="w-full px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger/10">Delete</button>
          </div>}
        </div>
      </div>
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">Current balance</p><p className="mt-1 text-2xl font-bold tracking-tight text-primary">{wallet.symbol}{wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
      <div className="space-y-2"><div className="flex items-center justify-between gap-3 text-xs"><span className="text-secondary">Monthly usage</span><span className="font-semibold text-primary whitespace-nowrap">{wallet.symbol}{spent.toLocaleString()} / {wallet.symbol}{wallet.monthlyLimit.toLocaleString()}</span></div><ProgressBar value={spent} max={wallet.monthlyLimit || 1} height="sm" aria-label={`${wallet.name} monthly usage: ${usage}%`} /></div>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4"><span className="text-xs font-semibold text-secondary">{wallet.currency}</span><StatusBadge status={wallet.status === 'Active' ? 'active' : 'inactive'} label={wallet.status} className="text-[10px] py-0.5" /></div>
    </Card>
  );
}
