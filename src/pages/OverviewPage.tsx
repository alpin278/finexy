import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { BalanceCard, WalletList, MetricCard, ProfitLossChart, SpendingLimitCard, RecentActivityTable, SpendingInsightCard, QuickActions } from '../components/dashboard';
import { Button, Card, PageSkeleton, Select, WidgetErrorBoundary } from '../components/ui';
import { currentBudgetPeriod, periodLabel } from '../lib/budget-utils';
import { formatWalletAmount, loadOverviewPage, overviewErrorMessage, type OverviewPageData } from '../lib/overview';
import { useDataInvalidation, useDataRevalidation } from '../context/DataRevalidationContext';
import { getCachedPageData, isPageDataCacheFresh } from '../lib/page-data-cache';

export function OverviewPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState(currentBudgetPeriod());
  const cachedData = getCachedPageData<OverviewPageData>(`overview:${period}`);
  const [data, setData] = useState<OverviewPageData | null>(cachedData ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(cachedData === undefined);
  const invalidate = useDataInvalidation();

  const refresh = useCallback(async (nextPeriod: string, initial = false) => {
    const hasCachedData = getCachedPageData<OverviewPageData>(`overview:${nextPeriod}`) !== undefined;
    if (initial) setLoading(!hasCachedData);
    setError(null);
    try {
      setData(await loadOverviewPage(nextPeriod, { force: true }));
    } catch (reason) {
      if (!hasCachedData) {
        setError(overviewErrorMessage(reason));
        setData(null);
      } else setError(overviewErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);
  useDataRevalidation(['transactions', 'wallets', 'budgets', 'overview', 'settings'], () => refresh(period));

  useEffect(() => {
    const cached = getCachedPageData<OverviewPageData>(`overview:${period}`);
    setData(cached ?? null);
    setLoading(cached === undefined);
    if (isPageDataCacheFresh(`overview:${period}`)) return undefined;
    const timer = window.setTimeout(() => { void refresh(period, true); }, 0);
    return () => window.clearTimeout(timer);
  }, [period, refresh]);

  return <div className="min-w-0 space-y-6 pb-8 sm:space-y-7">
    <header className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
      <div className="min-w-0">
        <p className="hidden mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent sm:block">Personal finance cockpit</p>
        <h1 className="font-sans text-[clamp(1.55rem,2.2vw,2rem)] font-bold tracking-[-0.04em] text-primary"><span className="sm:hidden">Overview</span><span className="hidden sm:inline">Your financial overview</span></h1>
        <p className="hidden sm:mt-1 sm:block sm:max-w-2xl sm:text-sm text-secondary">A live view of settled balances, spending, and budget progress.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Reporting month" value={period} onChange={(event) => setPeriod(event.target.value)} options={(data?.availablePeriods ?? [period]).map((item) => ({ value: item, label: periodLabel(item) }))} icon={<i className="bi bi-calendar3 text-secondary" aria-hidden="true" />} />
        <Button variant="secondary" size="sm" onClick={() => void invalidate(['overview'])} leftIcon={<i className="bi bi-arrow-clockwise text-secondary" aria-hidden="true" />}>Refresh</Button>
      </div>
    </header>
    {loading ? <PageSkeleton variant="dashboard" /> : null}
    {!loading && error && !data ? <div className="rounded-2xl border border-danger/30 bg-card p-8 text-center"><p className="text-sm text-danger">{error}</p><Button variant="ghost" size="sm" onClick={() => void invalidate(['overview'])} className="mt-3 text-accent">Try again</Button></div> : null}
    {!loading && error && data ? <div role="alert" className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-primary">Live refresh failed. Showing the last successful overview.</div> : null}
    {!loading && data ? <>
      <section aria-label="Financial summary" className="space-y-4 sm:space-y-5">
        <div className="sm:hidden space-y-4"><Card padding="none" className="p-4"><p className="text-xs font-semibold text-secondary">Total balance</p><p className="mt-1 money-value value-change text-2xl font-bold tracking-tight text-primary">{formatWalletAmount(data.totalBalance, data.reportingCurrency)}</p><p className="mt-1 text-xs text-secondary">{data.reportingCurrency} · {data.wallets.filter((wallet) => wallet.status === 'Active').length} active wallets</p></Card><div className="grid grid-cols-2 gap-2.5">{data.metrics.map((metric) => <Card key={metric.id} padding="none" className="min-w-0 rounded-[18px] border-border bg-card p-3 shadow-none"><p className="truncate text-xs text-secondary">{metric.title}</p><p className="mt-1 min-w-0 text-[clamp(0.875rem,4vw,1rem)] font-bold leading-tight text-primary">{metric.format === 'percentage' ? `${metric.amount.toFixed(1)}%` : formatWalletAmount(metric.amount, data.reportingCurrency)}</p></Card>)}</div></div>
        <div className="hidden min-w-0 gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.35fr)_repeat(4,minmax(0,1fr))]"><BalanceCard amount={data.totalBalance} currency={data.reportingCurrency} period={periodLabel(data.period)} estimated={data.totalBalanceEstimated} valuationDisclosure={data.valuationDisclosure} className="min-h-[156px]" />{data.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} currency={data.reportingCurrency} className="min-h-[156px]" />)}</div>
        <div className="grid min-w-0 items-stretch gap-4 sm:gap-5 xl:grid-cols-12"><div className="min-w-0 xl:col-span-4"><WalletList wallets={data.wallets} onAddWallet={() => navigate('/wallets')} onWalletAction={() => navigate('/wallets')} className="h-full" /></div><div className="min-w-0 xl:col-span-8"><WidgetErrorBoundary title="The cash-flow chart could not be displayed."><ProfitLossChart data={data.cashFlowTrend} currency={data.reportingCurrency} className="h-full" /></WidgetErrorBoundary></div></div>
      </section>
      <section aria-label="Planning and activity" className="grid min-w-0 items-start gap-4 sm:gap-5 xl:grid-cols-12"><div className="flex min-w-0 flex-col gap-4 sm:gap-5 xl:col-span-4"><SpendingLimitCard data={data.budgetProgress} currency={data.reportingCurrency} onViewBudget={() => navigate('/budgets')} /><SpendingInsightCard categories={data.categorySpending} currency={data.reportingCurrency} /><QuickActions /></div><div className="min-w-0 xl:col-span-8"><RecentActivityTable activities={data.recentTransactions} /></div></section>
    </> : null}
  </div>;
}

export default OverviewPage;
