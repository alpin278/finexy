import { Target } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function BudgetsPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div>
        <h1 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">Budgets</h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">
          Plan spending limits and monitor your monthly budgets.
        </p>
      </div>

      <Card padding="lg" className="border-dashed flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-border/60 flex items-center justify-center text-secondary mb-3">
          <Target className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-primary">Budgets View Placeholder</h2>
        <p className="text-xs sm:text-sm text-secondary max-w-sm mt-1">
          Budget planning and monitoring will be integrated in a later phase.
        </p>
      </Card>
    </div>
  );
}

export default BudgetsPage;
