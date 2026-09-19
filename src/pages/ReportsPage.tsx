import { useState } from 'react';
import { CalendarDays, ChevronDown, Download, FileDown, FileText } from 'lucide-react';
import { reportSnapshots } from '../data/reports';
import type { ReportPeriod } from '../types/reports';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  CashFlowTrendChart,
  ExpenseCategoryChart,
  FinancialHealthCard,
  LiquidityBreakdown,
  ReportPeriodTabs,
  ReportSummary,
  SurplusInsight,
} from '../components/reports';

export function ReportsPage() {
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>('this-month');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState('');
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [customStart, setCustomStart] = useState('2026-04-01');
  const [customEnd, setCustomEnd] = useState('2026-04-30');

  const snapshot = reportSnapshots[activePeriod];
  const customRangeError = customStart > customEnd ? 'End date must be on or after the start date.' : '';
  const periodLabel = activePeriod === 'custom-range'
    ? `Custom Range (${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${customStart}T00:00:00`))}-${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${customEnd}T00:00:00`))})`
    : snapshot.periodLabel;

  const handlePeriodChange = (period: ReportPeriod) => {
    setActivePeriod(period);
    if (period === 'custom-range') setIsCustomRangeOpen(true);
  };

  const handleExport = (format: 'PDF' | 'CSV') => {
    setIsExportOpen(false);
    setExportFeedback(`Export ${format} prepared in prototype mode.`);
    window.setTimeout(() => setExportFeedback(''), 2200);
  };

  const applyCustomRange = () => {
    if (customRangeError) return;
    setIsCustomRangeOpen(false);
    setExportFeedback(`Custom range set to ${customStart} through ${customEnd}.`);
    window.setTimeout(() => setExportFeedback(''), 2200);
  };

  return (
    <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] space-y-5 pb-8 animate-in fade-in-50 duration-200 sm:space-y-6">
      <header className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
            <span>Performance Intel</span><span className="h-1 w-1 rounded-full bg-accent/60" /><span>Q2 Fiscal 2026</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-primary sm:text-[32px]">Financial Analytics &amp; Reports</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-secondary sm:text-sm">Deep dive into your cash flow trends, spending distributions, income streams, and savings performance.</p>
        </div>

        <div className="relative flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <Button variant="secondary" size="sm" onClick={() => setIsExportOpen((open) => !open)} aria-expanded={isExportOpen} aria-haspopup="menu" leftIcon={<Download className="h-3.5 w-3.5" />} rightIcon={<ChevronDown className="h-3.5 w-3.5" />} className="w-full sm:w-auto">
              Export PDF/CSV
            </Button>
            {isExportOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-full min-w-[164px] rounded-[14px] border border-border bg-white p-1.5 shadow-[0_12px_28px_rgba(23,23,20,0.12)] sm:w-auto" role="menu">
                <button type="button" role="menuitem" onClick={() => handleExport('PDF')} className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface"><FileText className="h-3.5 w-3.5 text-secondary" />Export PDF</button>
                <button type="button" role="menuitem" onClick={() => handleExport('CSV')} className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface"><FileDown className="h-3.5 w-3.5 text-secondary" />Export CSV</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium text-secondary sm:pl-2"><CalendarDays className="h-3.5 w-3.5" />{periodLabel}</div>
        </div>
      </header>

      <div className="flex min-w-0 flex-col gap-3 rounded-[18px] border border-border bg-surface/50 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:p-3">
        <ReportPeriodTabs activePeriod={activePeriod} onChange={handlePeriodChange} />
        <div className="flex items-center gap-2 px-1 text-[10px] font-semibold text-secondary sm:px-2"><span className="h-1.5 w-1.5 rounded-full bg-success" />Current period: <span className="text-primary">{periodLabel}</span></div>
      </div>

      {exportFeedback && <div role="status" className="rounded-[12px] border border-success/20 bg-success/[0.08] px-3 py-2 text-xs font-medium text-success">{exportFeedback}</div>}

      <ReportSummary metrics={snapshot.summaryMetrics} />
      <CashFlowTrendChart data={snapshot.cashFlow} stats={snapshot.cashFlowStats} highlight={snapshot.highlight} />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <LiquidityBreakdown items={snapshot.liquidity} />
        <ExpenseCategoryChart categories={snapshot.expenses} />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <FinancialHealthCard health={snapshot.health} peerBenchmark={snapshot.peerBenchmark} />
        <SurplusInsight message={snapshot.surplusInsight} onReview={() => setIsInsightOpen(true)} />
      </div>

      <Modal isOpen={isCustomRangeOpen} onClose={() => setIsCustomRangeOpen(false)} title="Choose a custom range" description="This frontend prototype uses local mock data only." maxWidth="sm" footer={<><Button variant="ghost" size="sm" onClick={() => setIsCustomRangeOpen(false)}>Cancel</Button><Button variant="primary" size="sm" disabled={Boolean(customRangeError)} onClick={applyCustomRange}>Apply range</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><label htmlFor="report-custom-start" className="text-xs font-semibold text-primary">Start date</label><Input id="report-custom-start" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></div>
          <div className="space-y-1.5"><label htmlFor="report-custom-end" className="text-xs font-semibold text-primary">End date</label><Input id="report-custom-end" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></div>
        </div>
        {customRangeError && <p role="alert" className="mt-3 text-xs font-medium text-danger">{customRangeError}</p>}
        <p className="mt-4 rounded-[12px] bg-surface px-3 py-2 text-xs leading-5 text-secondary">Changing the dates updates the selected period label in this local view; it does not query a backend.</p>
      </Modal>

      <Modal isOpen={isInsightOpen} onClose={() => setIsInsightOpen(false)} title="Review Allocation" description="Informational prototype view" maxWidth="sm" footer={<Button variant="primary" size="sm" onClick={() => setIsInsightOpen(false)}>Done</Button>}>
        <div className="rounded-[14px] border border-border bg-surface p-4"><p className="text-sm font-semibold text-primary">Surplus cash review</p><p className="mt-2 text-xs leading-5 text-secondary">The mock dataset shows a $12,400 buffer above its configured safety target. Use this space to review your own allocation choices later; Finexy does not execute transfers or recommend products here.</p></div>
      </Modal>
    </div>
  );
}

export default ReportsPage;
