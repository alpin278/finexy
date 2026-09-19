import type { ReportSummaryMetric } from '../../types/reports';
import { ReportMetricCard } from './ReportMetricCard';

interface ReportSummaryProps {
  metrics: ReportSummaryMetric[];
}

export function ReportSummary({ metrics }: ReportSummaryProps) {
  return (
    <section aria-label="Report summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => <ReportMetricCard key={metric.id} metric={metric} />)}
    </section>
  );
}
