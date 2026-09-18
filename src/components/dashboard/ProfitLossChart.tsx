import { useState } from 'react';
import { Card } from '../ui/Card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { ProfitLossMonth } from '../../types/finance';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ProfitLossChartProps {
  data: ProfitLossMonth[];
  className?: string;
}

// Custom Tooltip matching Finexy styling
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const profit = payload.find((p: any) => p.dataKey === 'profit')?.value || 0;
    const loss = payload.find((p: any) => p.dataKey === 'loss')?.value || 0;
    const net = profit - loss;

    return (
      <div className="bg-white p-3 rounded-2xl border border-border shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] text-xs z-50 animate-in fade-in-50 duration-100">
        <p className="font-bold text-primary mb-1.5">{label} Overview</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-secondary">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Profit:
            </span>
            <span className="font-semibold text-primary">${profit.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-secondary">
              <span className="w-2 h-2 rounded-full bg-dark" />
              Loss:
            </span>
            <span className="font-semibold text-primary">${loss.toLocaleString()}</span>
          </div>
          <div className="pt-1.5 mt-0.5 border-t border-border flex items-center justify-between gap-4">
            <span className="text-secondary font-medium">Net:</span>
            <span className={cn('font-bold', net >= 0 ? 'text-success' : 'text-danger')}>
              ${net.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function ProfitLossChart({ data, className }: ProfitLossChartProps) {
  const [period, setPeriod] = useState<'Monthly' | 'Weekly' | 'Yearly'>('Monthly');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const periods: ('Monthly' | 'Weekly' | 'Yearly')[] = ['Monthly', 'Weekly', 'Yearly'];

  return (
    <Card className={cn('p-5 sm:p-6 flex flex-col justify-between', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-primary">Total Income</h3>
            <span className="text-xs text-secondary font-medium">• Profit and Loss</span>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            View your income in a certain period of time
          </p>
        </div>

        {/* Legend + Period Select */}
        <div className="flex items-center gap-4 self-start sm:self-auto">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-secondary font-medium">Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-dark" />
              <span className="text-secondary font-medium">Loss</span>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border bg-surface hover:bg-white text-xs font-semibold text-primary transition-colors cursor-pointer"
            >
              <span>{period}</span>
              <ChevronDown className={cn('w-3 h-3 text-secondary transition-transform', isDropdownOpen && 'rotate-180')} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-28 bg-white border border-border rounded-xl shadow-lg py-1 z-30 animate-in fade-in-80 duration-150">
                {periods.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPeriod(p);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                      p === period ? 'bg-surface text-primary font-semibold' : 'text-secondary hover:bg-surface hover:text-primary'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full flex-1 min-h-[240px] pt-4">
        <ResponsiveContainer width="100%" height="100%" minHeight={220} minWidth={200}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barSize={18}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#ECECE8"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#777771', fontSize: 11, fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#777771', fontSize: 10 }}
              tickFormatter={(v) => `$${v >= 1000 ? v / 1000 + 'k' : v}`}
              dx={-4}
            />
            <Tooltip
              content={<CustomChartTooltip />}
              cursor={{ fill: 'rgba(236, 236, 232, 0.4)', radius: 8 }}
            />
            <Bar
              dataKey="loss"
              name="Loss"
              stackId="a"
              fill="#22221C"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="profit"
              name="Profit"
              stackId="a"
              fill="#FF5A36"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default ProfitLossChart;
