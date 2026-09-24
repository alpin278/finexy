import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { WalletCurrencyCode } from '../../types/finance';
import type { ReportTrendPoint } from '../../lib/reports';
import type { ReportStat } from '../../types/reports';
import { Card } from '../ui/Card';
import { CashFlowStats } from './CashFlowStats';
import { formatCompactMoney, formatMoney } from './reportUtils';
import { signedChartDomain } from '../../lib/chart-scale';

export function CashFlowTrendChart({ data, stats, currency }: { data: ReportTrendPoint[]; stats: ReportStat[]; currency: WalletCurrencyCode }) {
  const domain = signedChartDomain(data.flatMap((point) => [point.income, point.expenses, point.net]));
  return (
    <section aria-labelledby="cash-flow-title" className="space-y-3">
      <Card padding="none" data-money-chart className="min-w-0 overflow-hidden p-4 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="cash-flow-title" className="text-base font-bold tracking-tight text-primary sm:text-lg">Income vs Expense &amp; Cash Flow Trend</h2>
            <p className="mt-1 text-xs leading-5 text-secondary">Completed ledger activity in the selected reporting currency.</p>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] font-semibold text-secondary">
            <span><i className="bi bi-circle-fill mr-1 text-dark" aria-hidden="true" />Inflow</span>
            <span><i className="bi bi-circle-fill mr-1 text-accent" aria-hidden="true" />Outflow</span>
            <span><i className="bi bi-circle-fill mr-1 text-success" aria-hidden="true" />Net</span>
          </div>
        </div>
        {data.length ? (
          <div className="h-[250px] pt-4 sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid, #ECECE8)" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--chart-text, #777771)', fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
                <YAxis domain={domain} tickFormatter={(value) => formatCompactMoney(Number(value), currency)} tick={{ fill: 'var(--chart-text, #777771)', fontSize: 10 }} axisLine={false} tickLine={false} width={62} tickCount={5} />
                <Tooltip
                  formatter={(value, name) => [formatMoney(Number(value), currency), String(name)]}
                  contentStyle={{ border: '1px solid var(--color-border)', borderRadius: 14, background: 'var(--color-card)', color: 'var(--color-primary)', fontSize: 11, boxShadow: 'var(--shadow-dropdown)', padding: '10px 12px' }}
                  labelStyle={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: 4 }}
                />
                <Line type="linear" dataKey="income" name="Inflow" stroke="var(--chart-dark, #22221C)" strokeWidth={2.5} dot={{ r: 2.5, fill: 'var(--chart-dark, #22221C)', strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
                <Line type="linear" dataKey="expenses" name="Outflow" stroke="#FF5A36" strokeWidth={2.5} dot={{ r: 2.5, fill: '#FF5A36', strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
                <Line type="linear" dataKey="net" name="Net" stroke="#55B88B" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 2, fill: '#55B88B', strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="flex h-[290px] items-center justify-center text-center text-sm text-secondary">No qualifying cash-flow activity in this period.</div>}
      </Card>
      <CashFlowStats stats={stats} />
    </section>
  );
}
