import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { BalanceCard, WalletList, MetricCard, ProfitLossChart, SpendingLimitCard, RecentActivityTable, SpendingInsightCard, QuickActions } from '../components/dashboard';
import { Button, PageSkeleton, Select, WidgetErrorBoundary } from '../components/ui';
import { currentBudgetPeriod, periodLabel } from '../lib/budget-utils';
import { loadOverviewPage, overviewErrorMessage, type OverviewPageData } from '../lib/overview';
import { useDataInvalidation, useDataRevalidation } from '../context/DataRevalidationContext';

export function OverviewPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState(currentBudgetPeriod());
  const [data, setData] = useState<OverviewPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const invalidate = useDataInvalidation();

  const refresh = useCallback(async (nextPeriod: string, initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      setData(await loadOverviewPage(nextPeriod));
    } catch (reason) {
      if (initial) {
        setError(overviewErrorMessage(reason));
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);
  useDataRevalidation(['transactions', 'wallets', 'budgets', 'overview', 'settings'], () => refresh(period));

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(period, true); }, 0);
    return () => window.clearTimeout(timer);
  }, [period, refresh]);

  return <div className="min-w-0 space-y-6 pb-8 sm:space-y-7">
    <header className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Personal finance cockpit</p>
        <h1 className="font-sans text-[clamp(1.55rem,2.2vw,2rem)] font-bold tracking-[-0.04em] text-primary">Your financial overview</h1>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-secondary sm:text-sm">A live view of settled balances, spending, and budget progress.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Reporting month" value={period} onChange={(event) => setPeriod(event.target.value)} options={(data?.availablePeriods ?? [period]).map((item) => ({ value: item, label: periodLabel(item) }))} icon={<i className="bi bi-calendar3 text-secondary" aria-hidden="true" />} />
        <Button variant="secondary" size="sm" onClick={() => void invalidate(['overview'])} leftIcon={<i className="bi bi-arrow-clockwise text-secondary" aria-hidden="true" />}>Refresh</Button>
      </div>
    </header>
    {loading ? <PageSkeleton variant="dashboard" /> : null}
    {!loading && error ? <div className="rounded-2xl border border-danger/30 bg-card p-8 text-center"><p className="text-sm text-danger">{error}</p><Button variant="ghost" size="sm" onClick={() => void invalidate(['overview'])} className="mt-3 text-accent">Try again</Button></div> : null}
    {!loading && !error && data ? <>
      <section aria-label="Financial summary" className="space-y-4 sm:space-y-5">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.35fr)_repeat(4,minmax(0,1fr))]"><BalanceCard amount={data.totalBalance} currency={data.reportingCurrency} period={periodLabel(data.period)} estimated={data.totalBalanceEstimated} valuationDisclosure={data.valuationDisclosure} className="min-h-[156px]" />{data.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} currency={data.reportingCurrency} className="min-h-[156px]" />)}</div>
        <div className="grid min-w-0 items-stretch gap-4 sm:gap-5 xl:grid-cols-12"><div className="min-w-0 xl:col-span-4"><WalletList wallets={data.wallets} onAddWallet={() => navigate('/wallets')} onWalletAction={() => navigate('/wallets')} className="h-full" /></div><div className="min-w-0 xl:col-span-8"><WidgetErrorBoundary title="The cash-flow chart could not be displayed."><ProfitLossChart data={data.cashFlowTrend} currency={data.reportingCurrency} className="h-full" /></WidgetErrorBoundary></div></div>
      </section>
      <section aria-label="Planning and activity" className="grid min-w-0 items-start gap-4 sm:gap-5 xl:grid-cols-12"><div className="flex min-w-0 flex-col gap-4 sm:gap-5 xl:col-span-4"><SpendingLimitCard data={data.budgetProgress} currency={data.reportingCurrency} onViewBudget={() => navigate('/budgets')} /><SpendingInsightCard categories={data.categorySpending} currency={data.reportingCurrency} /><QuickActions /></div><div className="min-w-0 xl:col-span-8"><RecentActivityTable activities={data.recentTransactions} /></div></section>
    </> : null}
  </div>;
}

export default OverviewPage;
