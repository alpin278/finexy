import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowUpRight, Plus, Wallet } from 'lucide-react';

export function OverviewPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">
            Good morning, Sajibur
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
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
      <Card padding="md" className="bg-gradient-to-r from-white to-surface border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">Overview Dashboard Placeholder</h3>
              <p className="text-xs text-secondary">
                AppShell, client-side routing, design tokens, and synchronized navigation active.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-accent">
            Phase 1.1 Hardened <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Card>
    </div>
  );
}

export default OverviewPage;
