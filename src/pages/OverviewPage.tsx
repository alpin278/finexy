import { useState } from 'react';
import { Calendar, Download, ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  totalBalanceData,
  mockWallets,
  mockMetrics,
  mockCashFlowData,
  mockSpendingCategories,
  mockSpendingLimit,
  mockRecentActivities,
} from '../data/overview';
import {
  BalanceCard,
  WalletList,
  MetricCard,
  ProfitLossChart,
  SpendingLimitCard,
  RecentActivityTable,
  SpendingInsightCard,
  QuickActions,
} from '../components/dashboard';
import { cn } from '../lib/utils';

export function OverviewPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('12 Apr, 2026 - 18 Apr, 2026');
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState(false);

  const dateRangeOptions = ['Today', '12 Apr, 2026 - 18 Apr, 2026', 'This Month (Apr 2026)', 'Last 30 Days', 'Q1 2026'];

  const handleExport = () => {
    setExportFeedback(true);
    window.setTimeout(() => setExportFeedback(false), 2000);
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in-50 duration-200 sm:space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-primary sm:text-[28px] lg:text-[32px]">Good morning, Sajibur</h1>
          <p className="mt-0.5 text-xs text-secondary sm:text-sm">A clear view of your balance, spending, and progress this month.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <button type="button" onClick={() => setIsDateRangeOpen(!isDateRangeOpen)} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-2xs transition-colors hover:bg-surface" aria-label="Select date range" aria-expanded={isDateRangeOpen}>
              <Calendar className="h-3.5 w-3.5 text-secondary" /><span>{dateRange}</span><ChevronDown className={cn('h-3 w-3 text-secondary transition-transform', isDateRangeOpen && 'rotate-180')} />
            </button>
            {isDateRangeOpen && <div className="absolute right-0 z-40 mt-2 w-56 rounded-2xl border border-border bg-white py-1.5 shadow-lg animate-in fade-in-80 duration-150">{dateRangeOptions.map((option) => <button key={option} type="button" onClick={() => { setDateRange(option); setIsDateRangeOpen(false); }} className={cn('flex w-full cursor-pointer items-center justify-between px-3.5 py-2 text-left text-xs font-medium transition-colors', option === dateRange ? 'bg-surface font-semibold text-primary' : 'text-secondary hover:bg-surface hover:text-primary')}><span>{option}</span>{option === dateRange && <Check className="h-3.5 w-3.5 text-accent" />}</button>)}</div>}
          </div>
          <button type="button" onClick={handleExport} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-primary shadow-2xs transition-colors hover:bg-surface"><Download className="h-3.5 w-3.5 text-secondary" /><span>{exportFeedback ? 'Summary ready!' : 'Export summary'}</span></button>
        </div>
      </header>

      <section aria-label="Financial summary" className="grid items-stretch gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-12">
        <div className="flex flex-col gap-5 sm:gap-6 md:col-span-1 xl:col-span-4">
          <BalanceCard amount={totalBalanceData.amount} currency={totalBalanceData.currency} changePercentage={totalBalanceData.changePercentage} period={totalBalanceData.period} className="h-full" />
          <WalletList wallets={mockWallets} totalWalletsCount={6} onAddWallet={() => navigate('/wallets')} onWalletAction={() => navigate('/wallets')} className="h-full" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-1 xl:col-span-4">
          {mockMetrics.map((metric) => <MetricCard key={metric.id} metric={metric} className="h-full" />)}
        </div>

        <div className="h-full md:col-span-2 xl:col-span-4">
          <ProfitLossChart data={mockCashFlowData} className="h-full min-h-[340px]" />
        </div>
      </section>

      <section aria-label="Planning and activity" className="grid items-stretch gap-5 sm:gap-6 xl:grid-cols-12">
        <div className="flex flex-col gap-5 sm:gap-6 xl:col-span-4">
          <SpendingLimitCard data={mockSpendingLimit} onViewBudget={() => navigate('/budgets')} />
          <SpendingInsightCard categories={mockSpendingCategories} />
          <QuickActions />
        </div>
        <div className="xl:col-span-8">
          <RecentActivityTable activities={mockRecentActivities} className="h-full" />
        </div>
      </section>
    </div>
  );
}

export default OverviewPage;
