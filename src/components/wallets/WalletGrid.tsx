import type { Wallet, WalletCurrencyCode, WalletType } from '../../types/finance';
import { formatWalletAmount } from '../../lib/wallets';
import { WalletAccountCard } from './WalletAccountCard';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface WalletTemplate {
  name: string;
  type: WalletType;
  currency: WalletCurrencyCode;
  icon: string;
  description: string;
}

const starterWalletTemplates: WalletTemplate[] = [
  { name: 'Checking Account', type: 'bank', currency: 'USD', icon: 'bank', description: 'Primary bank account for income and daily expenses.' },
  { name: 'Cash Wallet', type: 'cash', currency: 'USD', icon: 'cash-stack', description: 'Physical cash on hand for day-to-day spending.' },
  { name: 'Savings Account', type: 'savings', currency: 'USD', icon: 'piggy-bank', description: 'Dedicated savings and emergency reserve.' },
  { name: 'Credit Card', type: 'card', currency: 'USD', icon: 'credit-card', description: 'Revolving card account for tracked purchases.' },
];

export interface WalletGridProps {
  wallets: Wallet[];
  defaultCurrency?: WalletCurrencyCode;
  openMenuId: string | null;
  onToggleMenu: (id: string) => void;
  onView: (wallet: Wallet) => void;
  onEdit: (wallet: Wallet) => void;
  onSetLimit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
  onCreate?: () => void;
  onUseTemplate?: (template: WalletTemplate) => void;
}

export function WalletGrid(props: WalletGridProps) {
  if (props.wallets.length === 0) {
    return (
      <div className="space-y-6">
        {/* Empty state prompt */}
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface text-secondary">
            <Icon name="wallet2" className="text-xl" />
          </span>
          <h3 className="mt-3 text-base font-bold text-primary">No active wallets</h3>
          <p className="mt-1 max-w-md mx-auto text-xs text-secondary leading-relaxed">
            All user-created wallets are archived or deleted. Create a new custom wallet or pick a starter template below to start tracking balances.
          </p>
          {props.onCreate && (
            <Button
              variant="accent"
              size="sm"
              leftIcon={<Icon name="plus-lg" />}
              onClick={props.onCreate}
              className="mt-4"
            >
              Add Wallet
            </Button>
          )}
        </div>

        {/* Starter suggestions section - explicitly marked as templates */}
        {props.onUseTemplate && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-primary">Starter suggestions</h3>
                <p className="text-xs text-secondary">
                  Templates only — selecting a template opens the wallet creator with zero balance and creates no automatic financial records.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {starterWalletTemplates.map((template) => {
                const templateCurrency = props.defaultCurrency || template.currency || 'USD';
                return (
                  <Card key={template.name} padding="md" className="flex flex-col justify-between border-dashed border-border/80 bg-surface/50 hover:border-border hover:bg-card transition-colors">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-accent">
                          <Icon name={template.icon} className="text-lg" />
                        </div>
                        <Badge variant="neutral">Template</Badge>
                      </div>
                      <h4 className="mt-3 text-sm font-bold text-primary">{template.name}</h4>
                      <p className="mt-1 text-xs text-secondary leading-relaxed">{template.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-secondary">
                        <span className="font-semibold text-primary">{templateCurrency}</span>
                        <span>·</span>
                        <span>Starts at {formatWalletAmount(0, templateCurrency)}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => props.onUseTemplate?.({ ...template, currency: templateCurrency })}
                    >
                      Use Template
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section aria-label="Wallet accounts" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
      {props.wallets.map((wallet) => (
        <WalletAccountCard
          key={wallet.id}
          wallet={wallet}
          menuOpen={props.openMenuId === wallet.id}
          onToggleMenu={() => props.onToggleMenu(wallet.id)}
          onView={() => props.onView(wallet)}
          onEdit={() => props.onEdit(wallet)}
          onSetLimit={() => props.onSetLimit(wallet)}
          onDelete={() => props.onDelete(wallet)}
        />
      ))}
    </section>
  );
}
