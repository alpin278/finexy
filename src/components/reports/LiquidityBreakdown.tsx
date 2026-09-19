import { ArrowDownRight, ArrowUpRight, Check, Droplets } from 'lucide-react';
import type { LiquidityBreakdownItem } from '../../types/reports';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { formatUsd } from './reportUtils';

interface LiquidityBreakdownProps {
  items: LiquidityBreakdownItem[];
}

export function LiquidityBreakdown({ items }: LiquidityBreakdownProps) {
  const maxValue = Math.max(...items.slice(0, -1).map((item) => Math.abs(item.amount)));

  return (
    <Card padding="none" className="h-full overflow-hidden p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-primary sm:text-lg">Monthly Cash Flow &amp; Liquidity Velocity</h2>
          <p className="mt-1 text-xs leading-5 text-secondary">Waterfall reconciliation from total inflow to real retained liquidity.</p>
        </div>
        <div className="hidden shrink-0 rounded-full bg-surface px-2.5 py-1.5 text-[10px] font-bold text-secondary sm:block">Reconciled Apr 30</div>
      </div>
      <div className="mt-5 divide-y divide-border/70">
        {items.map((item) => {
          const isTotal = item.tone === 'total';
          const isPositive = item.amount > 0;
          const width = Math.max(12, Math.round((Math.abs(item.amount) / maxValue) * 100));
          return (
            <div key={item.id} className={cn('relative py-3.5 first:pt-0 last:pb-0', isTotal && 'mt-1 rounded-[14px] border border-success/20 bg-success/[0.06] px-3.5 py-3.5')}>
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full', isTotal ? 'bg-success text-white' : isPositive ? 'bg-success/12 text-success' : 'bg-accent/10 text-accent')}>
                      {isTotal ? <Check className="h-3 w-3" /> : isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    </span>
                    <p className={cn('truncate text-xs font-bold', isTotal ? 'text-primary' : 'text-primary')}>{item.label}</p>
                  </div>
                  <p className="mt-1 pl-7 text-[10px] leading-4 text-secondary">{item.description}</p>
                </div>
                <p className={cn('shrink-0 text-sm font-bold tracking-tight', isTotal || isPositive ? 'text-success' : 'text-primary')}>{item.amount > 0 ? '+' : '−'}{formatUsd(Math.abs(item.amount))}</p>
              </div>
              {!isTotal && <div className="mt-2 h-1 overflow-hidden rounded-full bg-border/60"><div className={cn('h-full rounded-full', isPositive ? 'bg-success/55' : 'bg-accent/55')} style={{ width: `${width}%` }} /></div>}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-[12px] bg-surface px-3 py-2 text-[10px] text-secondary"><Droplets className="h-3.5 w-3.5 shrink-0 text-success" />Values are independent product-level mock aggregates for this prototype.</div>
    </Card>
  );
}
