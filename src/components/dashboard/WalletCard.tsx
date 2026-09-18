import { MoreVertical } from 'lucide-react';
import type { Wallet } from '../../types/finance';
import { StatusBadge } from '../ui/StatusBadge';
import { cn } from '../../lib/utils';

export interface WalletCardProps {
  wallet: Wallet;
  onActionClick?: (walletId: string) => void;
  className?: string;
}

export function WalletCard({ wallet, onActionClick, className }: WalletCardProps) {
  const formattedBalance = `${wallet.symbol}${wallet.balance.toLocaleString()}`;
  const formattedLimit = `Limit ${wallet.symbol}${wallet.monthlyLimit >= 1000 ? (wallet.monthlyLimit / 1000).toFixed(0) + 'k' : wallet.monthlyLimit}/mo`;

  return (
    <div
      className={cn(
        'p-3 sm:p-3.5 rounded-2xl bg-surface border border-border/80 hover:border-border transition-all flex items-center justify-between gap-3 group',
        className
      )}
    >
      {/* Left: Flag & Currency Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-base shadow-xs shrink-0 select-none">
          {wallet.flag}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">{wallet.currency}</span>
            <span className="text-xs font-semibold text-primary">{formattedBalance}</span>
          </div>
          <span className="text-[11px] text-secondary">{formattedLimit}</span>
        </div>
      </div>

      {/* Right: Status & Overflow menu */}
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge
          status={wallet.status === 'Active' ? 'active' : 'inactive'}
          label={wallet.status}
          className="text-[10px] py-0.5 px-2"
        />

        <button
          type="button"
          onClick={() => onActionClick?.(wallet.id)}
          aria-label={`Wallet actions for ${wallet.currency}`}
          className="w-7 h-7 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-white transition-colors cursor-pointer"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default WalletCard;
