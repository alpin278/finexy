import { Link } from 'react-router-dom';
import { ArrowRight, Plus, ReceiptText, Target, WalletCards } from 'lucide-react';
import { Card } from '../ui/Card';

const actions = [
  { label: 'Add Transaction', description: 'Record income or expense', path: '/transactions', icon: ReceiptText },
  { label: 'Add Wallet', description: 'Add an account or cash source', path: '/wallets', icon: WalletCards },
  { label: 'Create Budget', description: 'Plan category spending', path: '/budgets', icon: Target },
] as const;

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-primary">Quick actions</h3><p className="mt-0.5 text-xs text-secondary">Keep your money plan up to date</p></div><Plus className="h-4 w-4 text-accent" aria-hidden="true" /></div>
      <div className="mt-4 space-y-2">
        {actions.map(({ label, description, path, icon: Icon }) => (
          <Link key={path} to={path} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-accent/40 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-primary"><Icon className="h-4 w-4" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-primary">{label}</span><span className="mt-0.5 block text-[11px] text-secondary">{description}</span></span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
