import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowUpRight, Plus, Wallet } from 'lucide-react';

export function OverviewPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-bold text-[#171714] tracking-tight">
            Good morning, Sajibur
          </h1>
          <p className="text-xs sm:text-sm text-[#777771] mt-1">
            Stay on top of your tasks, monitor progress, and track status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm">
            Download Report
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Transaction
          </Button>
        </div>
      </div>

      {/* Phase 1 Verification Placeholder Banner */}
      <Card padding="md" className="bg-gradient-to-r from-white to-[#FAFAF8] border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#FF5A36]/10 flex items-center justify-center text-[#FF5A36]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#171714]">Overview Dashboard Placeholder</h3>
              <p className="text-xs text-[#777771]">
                AppShell, design tokens, typography, and navigation active. Full dashboard grid modules will be constructed in Phase 2.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#FF5A36]">
            Phase 1 Ready <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Card>
    </div>
  );
}
