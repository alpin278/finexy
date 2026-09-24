import { useEffect, useMemo, useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import type { ReportPeriod, ReportStat, ReportSummaryMetric } from '../types/reports';
import { reportRange, customReportRange, loadReportsData, reportsErrorMessage, type ReportPeriodRange, type ReportsData } from '../lib/reports';
import { formatMoney } from '../components/reports/reportUtils';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import { Modal } from '../components/ui/Modal';
import { CashFlowTrendChart, ExpenseCategoryChart, FinancialHealthCard, LiquidityBreakdown, ReportPeriodTabs, ReportSummary, SurplusInsight } from '../components/reports';
import { useDataRevalidation } from '../context/DataRevalidationContext';

function day(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
function initialRange() { return reportRange('this-month'); }

export function ReportsPage() {
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>('this-month');
  const [range, setRange] = useState<ReportPeriodRange>(initialRange);
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false); const [exportFeedback, setExportFeedback] = useState(''); const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [customStart, setCustomStart] = useState(day(new Date())); const [customEnd, setCustomEnd] = useState(day(new Date()));
  const customRangeError = customStart > customEnd ? 'End date must be on or after the start date.' : '';
  const refresh = async (nextRange: ReportPeriodRange, initial = false) => { if (initial) setLoading(true); setError(null); try { setData(await loadReportsData(nextRange)); } catch (reason) { if (initial) { setData(null); setError(reportsErrorMessage(reason)); } } finally { if (initial) setLoading(false); } };
  useDataRevalidation(['transactions', 'budgets', 'reports', 'settings'], () => refresh(range));
  useEffect(() => { const timer = window.setTimeout(() => { void refresh(range, true); }, 0); return () => window.clearTimeout(timer); }, [range]);
  const metrics = useMemo<ReportSummaryMetric[]>(() => {
    if (!data) return [];
    const { totals, reportingCurrency } = data;
    return [
      { id: 'savings-rate', label: 'Net Savings Rate', value: `${totals.savingsRate.toFixed(1)}%`, accent: totals.income > 0 ? 'Ledger derived' : 'No inflow', detail: 'Net cash retained ÷ inflow', icon: 'savings' },
      { id: 'total-inflow', label: 'Total Inflow', value: formatMoney(totals.income, reportingCurrency), accent: 'Completed income', detail: 'Transfers and pending rows excluded', icon: 'inflow' },
      { id: 'total-outflow', label: 'Total Outflow', value: formatMoney(totals.expenses, reportingCurrency), accent: 'Completed expenses', detail: 'Selected reporting currency only', icon: 'outflow' },
      { id: 'net-retained', label: 'Net Cash Retained', value: `${totals.net >= 0 ? '+' : '-'}${formatMoney(Math.abs(totals.net), reportingCurrency)}`, accent: totals.net >= 0 ? 'Positive cash flow' : 'Negative cash flow', detail: 'Inflow minus outflow', icon: 'retained' },
    ];
  }, [data]);
  const stats = useMemo<ReportStat[]>(() => {
    if (!data) return [];
    const activeBuckets = data.trend.length;
    const peak = [...data.trend].sort((a, b) => b.income - a.income)[0];
    return [
      { label: 'Average Spending', value: activeBuckets ? formatMoney(data.totals.expenses / activeBuckets, data.reportingCurrency) : formatMoney(0, data.reportingCurrency), icon: 'bi-bar-chart-line' },
      { label: 'Peak Inflow Period', value: peak && peak.income > 0 ? `${peak.label} (${formatMoney(peak.income, data.reportingCurrency)})` : 'No inflow recorded', icon: 'bi-arrow-down-left' },
      { label: 'Retention Rate', value: `${data.totals.savingsRate.toFixed(1)}%`, icon: 'bi-piggy-bank' },
    ];
  }, [data]);
  const handlePeriodChange = (period: ReportPeriod) => { if (period === 'custom-range') { setIsCustomRangeOpen(true); return; } setActivePeriod(period); setRange(reportRange(period)); };
  const applyCustomRange = () => { if (customRangeError) return; setActivePeriod('custom-range'); setRange(customReportRange(customStart, customEnd)); setIsCustomRangeOpen(false); };
  return <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] space-y-5 pb-8 animate-in fade-in-50 duration-200 sm:space-y-6"><header className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-accent"><span>Performance Intel</span><span className="h-1 w-1 rounded-full bg-accent/60" /><span>Ledger analytics</span></div><h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-primary sm:text-[32px]">Financial Analytics &amp; Reports</h1><p className="mt-1 max-w-2xl text-xs leading-5 text-secondary sm:text-sm">Cash flow, spending distribution, income streams, and savings performance from completed ledger activity.</p></div><div className="relative flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"><div className="relative w-full sm:w-auto"><Button variant="secondary" size="sm" onClick={() => setIsExportOpen((open) => !open)} aria-expanded={isExportOpen} aria-haspopup="menu" leftIcon={<i className="bi bi-download" aria-hidden="true" />} rightIcon={<i className="bi bi-chevron-down" aria-hidden="true" />} className="w-full sm:w-auto">Export PDF/CSV</Button>{isExportOpen && <div className="absolute right-0 top-full z-20 mt-2 w-full min-w-[164px] rounded-[14px] border border-border bg-card p-1.5 shadow-[0_12px_28px_rgba(23,23,20,0.12)] sm:w-auto" role="menu"><button type="button" role="menuitem" onClick={() => { setIsExportOpen(false); setExportFeedback('PDF export remains a prototype-only action.'); }} className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface"><i className="bi bi-file-earmark-pdf" aria-hidden="true" />Export PDF</button><button type="button" role="menuitem" onClick={() => { setIsExportOpen(false); setExportFeedback('CSV export remains a prototype-only action.'); }} className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface"><i className="bi bi-file-earmark-spreadsheet" aria-hidden="true" />Export CSV</button></div>}</div><div className="flex items-center gap-2 text-[10px] font-medium text-secondary sm:pl-2"><i className="bi bi-calendar3" aria-hidden="true" />{range.label}</div></div></header><div className="flex min-w-0 flex-col gap-3 rounded-[18px] border border-border bg-surface/50 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:p-3"><ReportPeriodTabs activePeriod={activePeriod} onChange={handlePeriodChange} /><div className="flex items-center gap-2 px-1 text-[10px] font-semibold text-secondary sm:px-2"><span className="h-1.5 w-1.5 rounded-full bg-success" />Selected period: <span className="text-primary">{range.label}</span></div></div>{exportFeedback && <div role="status" className="rounded-[12px] border border-success/20 bg-success/[0.08] px-3 py-2 text-xs font-medium text-success">{exportFeedback}</div>}{loading && <div role="status" className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-secondary">Loading your ledger-backed report…</div>}{!loading && error && <div className="rounded-2xl border border-danger/30 bg-card p-8 text-center"><p className="text-sm text-danger">{error}</p><button type="button" onClick={() => void refresh(range)} className="mt-3 text-xs font-semibold text-accent">Try again</button></div>}{!loading && !error && data && <><ReportSummary metrics={metrics} /><CashFlowTrendChart data={data.trend} stats={stats} currency={data.reportingCurrency} /><div className="grid min-w-0 gap-4 xl:grid-cols-[1.25fr_0.75fr]"><LiquidityBreakdown income={data.incomeCategories} expenses={data.expenseCategories} net={data.totals.net} currency={data.reportingCurrency} /><ExpenseCategoryChart categories={data.expenseCategories} currency={data.reportingCurrency} /></div><div className="grid min-w-0 gap-4 xl:grid-cols-[1.25fr_0.75fr]"><FinancialHealthCard savingsRate={data.totals.savingsRate} net={data.totals.net} budgetContext={data.budgetContext} /><SurplusInsight net={data.totals.net} currency={data.reportingCurrency} overBudgetCount={data.budgetContext?.overBudgetCount ?? null} /></div></>}<Modal isOpen={isCustomRangeOpen} onClose={() => setIsCustomRangeOpen(false)} title="Choose a custom range" description="Reports query completed ledger rows within this range." maxWidth="sm" footer={<><Button variant="ghost" size="sm" onClick={() => setIsCustomRangeOpen(false)}>Cancel</Button><Button variant="primary" size="sm" disabled={Boolean(customRangeError)} onClick={applyCustomRange}>Apply range</Button></>}><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="report-custom-start" className="text-xs font-semibold text-primary">Start date</label><DatePicker id="report-custom-start" value={customStart} onChange={setCustomStart} /></div><div className="space-y-1.5"><label htmlFor="report-custom-end" className="text-xs font-semibold text-primary">End date</label><DatePicker id="report-custom-end" value={customEnd} onChange={setCustomEnd} /></div></div>{customRangeError && <p role="alert" className="mt-3 text-xs font-medium text-danger">{customRangeError}</p>}</Modal></div>;
}
export default ReportsPage;
