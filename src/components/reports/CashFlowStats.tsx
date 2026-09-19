import { Activity, ArrowUpRight, Flame } from 'lucide-react';
import type { CashFlowStats as CashFlowStatsData } from '../../types/reports';
import { Card } from '../ui/Card';

interface CashFlowStatsProps {
  stats: CashFlowStatsData;
}

export function CashFlowStats({ stats }: CashFlowStatsProps) {
  const items = [
    { label: 'Avg. Monthly Burn', value: stats.averageMonthlyBurn, icon: Flame },
    { label: 'Peak Inflow', value: stats.peakInflow, icon: ArrowUpRight },
    { label: 'Capital Retention', value: stats.capitalRetention, icon: Activity },
  ];

  return (
    <Card padding="none" className="grid grid-cols-1 divide-y divide-border/70 bg-surface/45 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-secondary shadow-sm"><Icon className="h-3.5 w-3.5" /></span>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary">{label}</p>
            <p className="mt-1 truncate text-sm font-bold text-primary">{value}</p>
          </div>
        </div>
      ))}
    </Card>
  );
}
