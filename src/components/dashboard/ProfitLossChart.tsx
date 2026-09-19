import { useState } from 'react';
import { Card } from '../ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { CashFlowMonth } from '../../types/finance';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ProfitLossChartProps {
  data: CashFlowMonth[];
  className?: string;
}

function CashFlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const income = payload.find((item: any) => item.dataKey === 'income')?.value || 0;
  const expenses = payload.find((item: any) => item.dataKey === 'expenses')?.value || 0;
  const net = income - expenses;

  return (
    <div className="z-50 rounded-2xl border border-border bg-white p-3 text-xs shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] animate-in fade-in-50 duration-100">
      <p className="mb-1.5 font-bold text-primary">{label} cash flow</p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4"><span className="flex items-center gap-1.5 text-secondary"><span className="h-2 w-2 rounded-full bg-accent" />Income</span><span className="font-semibold text-primary">${income.toLocaleString()}</span></div>
        <div className="flex items-center justify-between gap-4"><span className="flex items-center gap-1.5 text-secondary"><span className="h-2 w-2 rounded-full bg-dark" />Expenses</span><span className="font-semibold text-primary">${expenses.toLocaleString()}</span></div>
        <div className="mt-0.5 flex items-center justify-between gap-4 border-t border-border pt-1.5"><span className="font-medium text-secondary">Net</span><span className={cn('font-bold', net >= 0 ? 'text-success' : 'text-danger')}>{net >= 0 ? '+' : '-'}${Math.abs(net).toLocaleString()}</span></div>
      </div>
    </div>
  );
}

export function ProfitLossChart({ data, className }: ProfitLossChartProps) {
  const [period, setPeriod] = useState<'Monthly' | 'Weekly' | 'Yearly'>('Monthly');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const periods: ('Monthly' | 'Weekly' | 'Yearly')[] = ['Monthly', 'Weekly', 'Yearly'];

  return (
    <Card className={cn('flex flex-col justify-between p-5 sm:p-6', className)}>
      <div className="flex flex-col gap-2.5 border-b border-border/60 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="whitespace-nowrap text-sm font-bold tracking-tight text-primary sm:text-base">Income vs Expenses</h3>
            <span className="whitespace-nowrap text-xs font-medium text-secondary">• Cash flow trend</span>
          </div>
          <div className="relative">
            <button type="button" aria-label="Select cash flow period" aria-expanded={isDropdownOpen} onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-white">
              <span>{period}</span><ChevronDown className={cn('h-3 w-3 text-secondary transition-transform', isDropdownOpen && 'rotate-180')} />
            </button>
            {isDropdownOpen && <div className="absolute right-0 z-30 mt-1.5 w-28 rounded-xl border border-border bg-white py-1 shadow-lg animate-in fade-in-80 duration-150">{periods.map((option) => <button key={option} type="button" onClick={() => { setPeriod(option); setIsDropdownOpen(false); }} className={cn('w-full cursor-pointer px-3 py-1.5 text-left text-xs font-medium transition-colors', option === period ? 'bg-surface font-semibold text-primary' : 'text-secondary hover:bg-surface hover:text-primary')}>{option}</button>)}</div>}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-secondary">
          <p>Compare money in and money out across the selected period.</p>
          <div className="flex items-center gap-3"><div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /><span className="font-medium">Income</span></div><div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-dark" /><span className="font-medium">Expenses</span></div></div>
        </div>
      </div>
      <div className="min-h-[240px] w-full flex-1 pt-3">
        <ResponsiveContainer width="100%" height="100%" minHeight={220} minWidth={200}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECECE8" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#777771', fontSize: 11, fontWeight: 500 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#777771', fontSize: 10 }} tickFormatter={(value) => `$${value >= 1000 ? `${value / 1000}k` : value}`} dx={-4} />
            <Tooltip content={<CashFlowTooltip />} cursor={{ fill: 'rgba(236, 236, 232, 0.4)', radius: 8 }} />
            <Bar dataKey="expenses" name="Expenses" stackId="cash-flow" fill="#22221C" radius={[0, 0, 4, 4]} isAnimationActive={false} />
            <Bar dataKey="income" name="Income" stackId="cash-flow" fill="#FF5A36" radius={[6, 6, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default ProfitLossChart;
