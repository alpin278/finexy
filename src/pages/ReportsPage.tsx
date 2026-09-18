import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BarChart3, Download } from 'lucide-react';

export function ReportsPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Cash flow breakdowns, period comparisons, and monthly spending insights.
          </p>
        </div>

        <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
          Export PDF
        </Button>
      </div>

      <Card padding="lg" className="border-dashed flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-border/60 flex items-center justify-center text-secondary mb-3">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-primary">Reports & Analytics Placeholder</h3>
        <p className="text-xs sm:text-sm text-secondary max-w-sm mt-1">
          Screen 4 (Reports & Analytics Cash Flow & Donut breakdown) will be displayed here.
        </p>
      </Card>
    </div>
  );
}

export default ReportsPage;
