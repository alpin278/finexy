import { Card } from '../ui/Card';
import { ResponsiveContainer, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { CashFlowPoint } from '../../lib/overview';
import { formatWalletAmount } from '../../lib/overview';
import type { WalletCurrencyCode } from '../../types/finance';
import { cn } from '../../lib/utils';

export interface ProfitLossChartProps {
  data: CashFlowPoint[];
  currency: WalletCurrencyCode;
  className?: string;
}

export function ProfitLossChart({ data, currency, className }: ProfitLossChartProps) {
  const axisFormatter = (value: number) => new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

  return (
    <Card className={cn('flex min-w-0 flex-col overflow-hidden p-5 sm:p-6', className)}>
      <div className="border-b border-border/60 pb-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-bold tracking-tight text-primary sm:text-base">Income vs Expenses</h3>
            <span className="text-xs font-medium text-secondary"><span aria-hidden="true">·</span> Cash flow trend</span>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary">{currency}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-secondary">
          <p>Completed ledger activity over the last six months.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" />Income</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-dark" />Expenses</span>
          </div>
        </div>
      </div>
      <div className="min-h-[220px] w-full flex-1 pt-4">
        <ResponsiveContainer width="100%" height="100%" minHeight={220} minWidth={200}>
          <LineChart data={data} margin={{ top: 10, right: 8, left: 2, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECECE8" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#777771', fontSize: 11, fontWeight: 500 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#777771', fontSize: 10 }} tickFormatter={(value) => axisFormatter(Number(value))} width={48} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const income = Number(payload.find((item) => item.dataKey === 'income')?.value ?? 0);
                const expenses = Number(payload.find((item) => item.dataKey === 'expenses')?.value ?? 0);
                return <div className="rounded-2xl border border-border bg-white p-3 text-xs shadow-dropdown"><p className="mb-1.5 font-bold text-primary">{label} cash flow</p><p className="text-secondary">Income <span className="font-semibold text-primary">{formatWalletAmount(income, currency)}</span></p><p className="text-secondary">Expenses <span className="font-semibold text-primary">{formatWalletAmount(expenses, currency)}</span></p><p className="mt-1 border-t border-border pt-1 font-semibold text-primary">Net {formatWalletAmount(income - expenses, currency)}</p></div>;
              }}
              cursor={{ stroke: '#D8D8D2', strokeWidth: 1 }}
            />
            <Line type="monotone" dataKey="income" name="Income" stroke="#FF5A36" strokeWidth={2.5} dot={{ r: 2.5, fill: '#FF5A36', strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#22221C" strokeWidth={2.5} dot={{ r: 2.5, fill: '#22221C', strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default ProfitLossChart;
