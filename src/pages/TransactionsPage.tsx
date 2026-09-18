import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, ArrowLeftRight } from 'lucide-react';

export function TransactionsPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-bold text-[#171714] tracking-tight">
            Transactions
          </h1>
          <p className="text-xs sm:text-sm text-[#777771] mt-1">
            Monitor inflows, outflows, and manage all your accounts' activities.
          </p>
        </div>

        <Button variant="accent" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Add Transaction
        </Button>
      </div>

      <Card padding="lg" className="border-dashed flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[#ECECE8]/60 flex items-center justify-center text-[#777771] mb-3">
          <ArrowLeftRight className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#171714]">Transactions View Placeholder</h3>
        <p className="text-xs sm:text-sm text-[#777771] max-w-sm mt-1">
          The shared AppShell is functioning properly. Screen 3 (Transactions Management & Add Transaction) components will be integrated in subsequent phases.
        </p>
      </Card>
    </div>
  );
}
