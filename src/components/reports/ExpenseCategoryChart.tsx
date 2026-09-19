import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ExpenseCategoryReport } from '../../types/reports';
import { Card } from '../ui/Card';
import { formatUsd } from './reportUtils';

interface ExpenseCategoryChartProps {
  categories: ExpenseCategoryReport[];
}

export function ExpenseCategoryChart({ categories }: ExpenseCategoryChartProps) {
  const total = categories.reduce((sum, category) => sum + category.amount, 0);
  const topSpend = categories.reduce((top, category) => category.amount > top.amount ? category : top, categories[0]);

  return (
    <Card padding="none" className="h-full overflow-hidden p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-primary sm:text-lg">Expenses by Category</h2>
          <p className="mt-1 text-xs text-secondary">April outflow composition</p>
        </div>
        <div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary">Total</p><p className="mt-1 text-base font-bold text-primary">{formatUsd(total)}</p></div>
      </div>
      <div className="mt-4 grid items-center gap-5 sm:grid-cols-[170px_minmax(0,1fr)]">
        <div className="relative mx-auto h-[170px] w-[170px]" aria-label={`Expense category donut, total ${formatUsd(total)}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categories} dataKey="amount" nameKey="label" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="#FFFFFF" strokeWidth={2}>
                {categories.map((category) => <Cell key={category.id} fill={category.color} />)}
              </Pie>
              <Tooltip contentStyle={{ border: '1px solid #ECECE8', borderRadius: 12, boxShadow: '0 8px 24px rgba(23,23,20,0.08)', fontSize: 11 }} formatter={(value) => [formatUsd(Number(value)), 'Spend']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary">Top Spend</p><p className="mt-1 text-sm font-bold text-primary">{topSpend.label.split(' & ')[0]}</p><p className="text-xs font-semibold text-accent">{topSpend.percentage}%</p></div>
        </div>
        <div className="space-y-3" aria-label="Expense category values">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-secondary">{category.label}</span>
              <span className="shrink-0 text-[11px] font-bold text-primary">{formatUsd(category.amount)}</span>
              <span className="w-7 shrink-0 text-right text-[10px] font-semibold text-secondary">{category.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
