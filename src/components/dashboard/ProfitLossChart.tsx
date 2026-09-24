import { Card } from '../ui/Card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CashFlowPoint } from '../../lib/overview';
import { formatWalletAmount } from '../../lib/overview';
import type { WalletCurrencyCode } from '../../types/finance';
import { cn } from '../../lib/utils';
import { positiveChartDomain } from '../../lib/chart-scale';

export interface ProfitLossChartProps {
  data: CashFlowPoint[];
  currency: WalletCurrencyCode;
  className?: string;
}

export function ProfitLossChart({ data, currency, className }: ProfitLossChartProps) {
  const domain = positiveChartDomain(data.flatMap((point) => [point.income, point.expenses]));
  const axisFormatter = (value: number) => new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

  return (
    <Card data-money-chart className={cn('flex min-w-0 flex-col overflow-hidden p-5 sm:p-6', className)}>
      <div className="border-b border-border/60 pb-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-bold tracking-tight text-primary sm:text-base">Income vs Expenses</h3>
            <span className="text-xs font-medium text-secondary"><span aria-hidden="true">·</span> Cash flow trend</span>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary">{currency}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-secondary">
          <p>Completed ledger activity across the selected year.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" />Income</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-dark" />Expenses</span>
          </div>
        </div>
      </div>
      <div className="h-[248px] w-full pt-4 sm:h-[272px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={200}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="18%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid, #ECECE8)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text, #777771)', fontSize: 10, fontWeight: 500 }} dy={8} interval={0} />
            <YAxis domain={domain} allowDataOverflow={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text, #777771)', fontSize: 10 }} tickFormatter={(value) => axisFormatter(Number(value))} width={62} tickCount={5} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const income = Number(payload.find((item) => item.dataKey === 'income')?.value ?? 0);
                const expenses = Number(payload.find((item) => item.dataKey === 'expenses')?.value ?? 0);
                return <div className="rounded-2xl border border-border bg-card p-3 text-xs shadow-dropdown"><p className="mb-1.5 font-bold text-primary">{label} cash flow</p><p className="text-secondary">Income <span className="money-value font-semibold text-primary">{formatWalletAmount(income, currency)}</span></p><p className="text-secondary">Expenses <span className="money-value font-semibold text-primary">{formatWalletAmount(expenses, currency)}</span></p><p className="mt-1 border-t border-border pt-1 font-semibold text-primary">Net <span className="money-value">{formatWalletAmount(income - expenses, currency)}</span></p></div>;
              }}
              cursor={{ fill: 'var(--chart-cursor, rgba(236,236,232,0.45))' }}
            />
            <Bar dataKey="income" name="Income" fill="#FF5A36" radius={[5, 5, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            <Bar dataKey="expenses" name="Expenses" fill="var(--chart-dark, #22221C)" radius={[5, 5, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default ProfitLossChart;
