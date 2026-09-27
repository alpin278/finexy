import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';
import { useRef, useState } from 'react';
import type { ReportCategory } from '../../lib/reports';
import type { WalletCurrencyCode } from '../../types/finance';
import { Card } from '../ui/Card';
import { formatMoney } from './reportUtils';

export function ExpenseCategoryChart({ categories, currency }: { categories: ReportCategory[]; currency: WalletCurrencyCode }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);
  const donutRef = useRef<HTMLDivElement>(null);
  const total = categories.reduce((sum, item) => sum + item.amount, 0);
  const selected = categories[selectedIndex] ?? categories[0];
  const displayedCategories = showAll || selectedIndex >= 6 ? categories : categories.slice(0, 6);
  const activeIndex = previewIndex ?? selectedIndex;
  const positionTooltip = (index: number, clientX: number, clientY: number) => { const rect = donutRef.current?.getBoundingClientRect(); if (!rect) return; setTooltip({ index, x: Math.max(4, Math.min(rect.width - 132, clientX - rect.left + 12)), y: Math.max(4, Math.min(rect.height - 80, clientY - rect.top + 12)) }); };
  return <Card padding="none" data-money-chart className="h-full overflow-hidden p-4 sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold tracking-tight text-primary sm:text-lg">Expenses by Category</h2><p className="mt-1 text-xs text-secondary">Completed expense transactions for this period.</p></div><div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary">Total</p><p className="money-value mt-1 text-base font-bold text-primary">{formatMoney(total, currency)}</p></div></div>
    {categories.length ? <div className="mt-4 grid min-w-0 items-center gap-5 sm:grid-cols-[170px_minmax(0,1fr)]">
      <div ref={donutRef} className="expense-category-donut relative mx-auto h-[170px] w-[170px]" aria-label={`Expense category donut, total ${formatMoney(total, currency)}`}>
        <ResponsiveContainer width="100%" height="100%"><PieChart accessibilityLayer={false} tabIndex={-1}><Pie data={categories} dataKey="amount" nameKey="label" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="var(--color-card, #FFFFFF)" strokeWidth={2} rootTabIndex={-1} isAnimationActive={false} onClick={(_, index) => { setSelectedIndex(index); setPreviewIndex(null); }} onMouseMove={(_, index, event) => { setPreviewIndex(index); positionTooltip(index, event.clientX, event.clientY); }} onMouseLeave={() => { setPreviewIndex(null); setTooltip(null); }} onTouchStart={(_, index, event) => { const touch = event.touches[0]; if (touch) { setPreviewIndex(index); positionTooltip(index, touch.clientX, touch.clientY); } }} onTouchMove={(_, index, event) => { const touch = event.touches[0]; if (touch) { setPreviewIndex(index); positionTooltip(index, touch.clientX, touch.clientY); } }} onTouchEnd={(_, index) => { setSelectedIndex(index); setPreviewIndex(null); setTooltip(null); }} shape={(props) => <Sector {...props} outerRadius={props.outerRadius + (props.index === activeIndex ? 7 : 0)} />}>{categories.map((category) => <Cell key={category.id} fill={category.color} cursor="pointer" />)}</Pie></PieChart></ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"><p className="max-w-24 truncate text-[10px] font-semibold uppercase text-secondary">{selected.label}</p><p className="text-xs font-semibold" style={{ color: selected.color }}>{selected.percentage.toFixed(1)}%</p></div>
        {tooltip && <div className="pointer-events-none absolute z-10 w-32 rounded-xl border border-border bg-card px-2.5 py-2 shadow-dropdown" style={{ left: tooltip.x, top: tooltip.y }}><p className="truncate text-[10px] font-semibold text-primary">{categories[tooltip.index]?.label}</p><p className="money-value mt-0.5 text-[11px] font-bold text-primary">{formatMoney(categories[tooltip.index]?.amount ?? 0, currency)}</p><p className="text-[10px] font-semibold text-secondary">{categories[tooltip.index]?.percentage.toFixed(1)}%</p></div>}
      </div>
      <div className="space-y-2">{displayedCategories.map((category) => { const categoryIndex = categories.indexOf(category); const active = categoryIndex === selectedIndex; return <button key={category.id} type="button" onClick={() => setSelectedIndex(categoryIndex)} className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${active ? 'bg-surface' : 'hover:bg-surface/70'}`} aria-pressed={active}><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} /><span className="min-w-0 flex-1 truncate text-[11px] font-medium text-secondary">{category.label}</span><span className="money-value shrink-0 text-[11px] font-bold text-primary">{formatMoney(category.amount, currency)}</span><span className="w-10 shrink-0 text-right text-[10px] font-semibold text-secondary">{category.percentage.toFixed(1)}%</span></button>; })}{categories.length > 6 && <button type="button" onClick={() => setShowAll((open) => !open)} className="mt-1 text-xs font-semibold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">{showAll || selectedIndex >= 6 ? 'Show fewer' : 'View all categories'}</button>}</div>
    </div> : <p className="mt-8 text-sm text-secondary">No qualifying expenses in this period.</p>}
  </Card>;
}
