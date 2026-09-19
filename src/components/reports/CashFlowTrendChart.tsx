import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CashFlowPoint } from '../../types/reports';
import { Card } from '../ui/Card';
import { CashFlowStats } from './CashFlowStats';
import { formatCompactUsd } from './reportUtils';

interface CashFlowTrendChartProps {
  data: CashFlowPoint[];
  stats: Parameters<typeof CashFlowStats>[0]['stats'];
  highlight: {
    period: string;
    netRate: string;
    inflow: string;
    outflow: string;
    balance: string;
  };
}

export function CashFlowTrendChart({ data, stats, highlight }: CashFlowTrendChartProps) {
  const aprilIndex = useMemo(() => data.findIndex((point) => point.month === 'Apr 26'), [data]);

  return (
    <section aria-labelledby="cash-flow-title" className="space-y-3">
      <Card padding="none" className="overflow-hidden p-4 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="cash-flow-title" className="text-base font-bold tracking-tight text-primary sm:text-lg">Income vs Expense &amp; Cash Flow Trend</h2>
              <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-accent">Live mock</span>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-secondary">Monthly breakdown comparing capital inflow, operational burn, and net surplus trajectory.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3 text-[10px] font-semibold text-secondary" aria-label="Chart legend">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-dark" />Inflow</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" />Outflow</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Net Margin</span>
          </div>
        </div>

        <div className="grid gap-4 pt-4 xl:grid-cols-[minmax(0,1fr)_184px]">
          <div className="min-w-0" aria-label="Chart summary: inflow, outflow, and net margin by month">
            <ResponsiveContainer width="100%" height={290}>
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={5}>
                <CartesianGrid stroke="#ECECE8" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#777771', fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tickFormatter={formatCompactUsd} tick={{ fill: '#777771', fontSize: 10 }} axisLine={false} tickLine={false} width={40} domain={[0, 50000]} ticks={[0, 12500, 25000, 37500, 50000]} />
                <Tooltip
                  cursor={{ fill: '#F2F2F0', opacity: 0.7 }}
                  contentStyle={{ border: '1px solid #ECECE8', borderRadius: 12, boxShadow: '0 8px 24px rgba(23,23,20,0.08)', fontSize: 11 }}
                  labelStyle={{ color: '#171714', fontWeight: 700, marginBottom: 5 }}
                  formatter={(value) => [`$${Number(value).toLocaleString('en-US')}`, '']}
                />
                <Legend content={() => null} />
                <Bar dataKey="inflow" name="Inflow" fill="#22221C" radius={[5, 5, 0, 0]} maxBarSize={18} />
                <Bar dataKey="outflow" name="Outflow" fill="#FF5A36" radius={[5, 5, 0, 0]} maxBarSize={18} />
                <Line dataKey="netMargin" name="Net Margin" type="monotone" stroke="#55B88B" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: '#FFFFFF', stroke: '#55B88B' }} activeDot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <aside className="rounded-[16px] border border-accent/20 bg-accent/[0.06] p-4" aria-label="April cash flow highlight">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">{highlight.period}</p>
            <p className="mt-3 text-lg font-bold tracking-tight text-primary">{highlight.netRate}</p>
            <div className="mt-4 space-y-2 border-y border-accent/15 py-3 text-xs">
              <div className="flex items-center justify-between gap-2"><span className="text-secondary">Inflow</span><strong className="text-success">{highlight.inflow}</strong></div>
              <div className="flex items-center justify-between gap-2"><span className="text-secondary">Outflow</span><strong className="text-accent">{highlight.outflow}</strong></div>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary">Balance</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-primary">{highlight.balance}</p>
            {aprilIndex === -1 && <p className="mt-2 text-[10px] text-secondary">Highlight uses the reference month from the prototype.</p>}
          </aside>
        </div>
      </Card>
      <CashFlowStats stats={stats} />
    </section>
  );
}
