import type { ReportSummaryMetric } from '../../types/reports';
import { ReportMetricCard } from './ReportMetricCard';
import { Card } from '../ui/Card';

interface ReportSummaryProps {
  metrics: ReportSummaryMetric[];
}

export function ReportSummary({ metrics }: ReportSummaryProps) {
  const net = metrics.find((metric) => metric.id === 'net-retained');
  const savingsRate = metrics.find((metric) => metric.id === 'savings-rate');
  const inflow = metrics.find((metric) => metric.id === 'total-inflow');
  const outflow = metrics.find((metric) => metric.id === 'total-outflow');
  return (
    <section aria-label="Report summary">
      {net && <Card className="sm:hidden" padding="none"><div className="p-4"><p className="text-xs font-semibold text-secondary">Net cash retained</p><p className="mt-1 text-2xl font-bold tracking-tight text-primary">{net.value}</p><p className="mt-1 text-xs text-secondary">{savingsRate?.value ?? '—'} savings rate</p><div className="mt-4 grid grid-cols-2 divide-x divide-border border-y border-border py-3"><div className="pr-3"><p className="text-xs text-secondary">Inflow</p><p className="mt-1 text-sm font-bold text-primary">{inflow?.value ?? '—'}</p></div><div className="pl-3"><p className="text-xs text-secondary">Outflow</p><p className="mt-1 text-sm font-bold text-primary">{outflow?.value ?? '—'}</p></div></div></div></Card>}
      <div className="hidden grid-cols-1 gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <ReportMetricCard key={metric.id} metric={metric} />)}
      </div>
    </section>
  );
}
