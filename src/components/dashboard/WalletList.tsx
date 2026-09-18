import { Card } from '../ui/Card';
import { WalletCard } from './WalletCard';
import type { Wallet } from '../../types/finance';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface WalletListProps {
  wallets: Wallet[];
  totalWalletsCount?: number;
  onWalletAction?: (walletId: string) => void;
  onAddWallet?: () => void;
  className?: string;
}

export function WalletList({
  wallets,
  totalWalletsCount = 6,
  onWalletAction,
  onAddWallet,
  className,
}: WalletListProps) {
  return (
    <Card className={cn('p-5 sm:p-6 flex flex-col justify-between', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-primary">Wallets</h3>
          <span className="text-xs text-secondary font-medium">| Total {totalWalletsCount} wallets</span>
        </div>

        <button
          type="button"
          onClick={onAddWallet}
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Wallet items stack */}
      <div className="flex flex-col gap-2.5 pt-3.5">
        {wallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            onActionClick={onWalletAction}
          />
        ))}
      </div>
    </Card>
  );
}

export default WalletList;
