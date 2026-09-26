import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { archiveBudget, budgetErrorMessage, createBudget, loadBudgetPage, updateBudget, type BudgetPageData } from '../lib/budgets';
import { currentBudgetPeriod, periodLabel } from '../components/budgets/budgetUtils';
import type { Budget, BudgetPeriod } from '../types/finance';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';

const Search = ({ className }: { className?: string }) => <Icon name="search" className={className} />;
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { BudgetFormModal, BudgetGrid, BudgetInsights, BudgetOverviewCard, BudgetSummary, BudgetTabs, DeleteBudgetDialog, BudgetDetailModal, type BudgetFilter, type BudgetFormValues } from '../components/budgets';
import { parseAmountNumber } from '../lib/amount-format';
import { StableFilterRegion } from '../components/ui/StableFilterRegion';
import { isFinexyActionState } from '../lib/interaction-actions';
import { useDataInvalidation, useDataRevalidation } from '../context/DataRevalidationContext';

const emptyData: BudgetPageData = { period: currentBudgetPeriod(), budgets: [], byCategory: {}, availablePeriods: [currentBudgetPeriod()], categories: [], summary: { activeBudgetCount: 0, totalsByCurrency: [], overBudgetCategoryCount: 0 }, displayPreferences: { reportingCurrency: 'USD', locale: 'en-US', numberFormat: '1,234.56', timeZone: 'Asia/Jakarta' } };

export function BudgetsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pageData, setPageData] = useState<BudgetPageData>(emptyData);
  const [activeFilter, setActiveFilter] = useState<BudgetFilter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('most-used');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [templateInitialValues, setTemplateInitialValues] = useState<Partial<BudgetFormValues> | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const invalidate = useDataInvalidation();

  const refresh = useCallback(async (period?: BudgetPeriod) => {
    const next = await loadBudgetPage(period);
    setPageData(next);
    setLoadError('');
    setDetailBudget((current) => current ? next.budgets.find((budget) => budget.id === current.id) ?? null : null);
  }, []);
  useDataRevalidation(['transactions', 'budgets', 'categories', 'settings'], () => refresh(pageData.period));

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const next = await loadBudgetPage();
        if (active) { setPageData(next); setLoadError(''); }
      } catch (error) {
        if (active) setLoadError(budgetErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => ({ all: pageData.budgets.length, on_track: pageData.budgets.filter((budget) => budget.status === 'on_track').length, near_limit: pageData.budgets.filter((budget) => budget.status === 'near_limit').length, over_budget: pageData.budgets.filter((budget) => budget.status === 'over_budget').length }), [pageData.budgets]);
  const visibleBudgets = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = pageData.budgets.filter((budget) => (activeFilter === 'all' || budget.status === activeFilter) && (!query || budget.categoryName.toLowerCase().includes(query)));
    return [...filtered].sort((a, b) => { if (sort === 'highest-spent') return b.spent - a.spent; if (sort === 'largest-budget') return b.monthlyLimit - a.monthlyLimit; if (sort === 'category-name') return a.categoryName.localeCompare(b.categoryName); return (b.spent / b.monthlyLimit) - (a.spent / a.monthlyLimit); });
  }, [activeFilter, pageData.budgets, search, sort]);

  const closeForm = () => { setFormOpen(false); setEditingBudget(null); setTemplateInitialValues(undefined); setDuplicateError(''); };
  const openCreate = () => { setActionError(''); setEditingBudget(null); setTemplateInitialValues(undefined); setDuplicateError(''); setFormOpen(true); };
  const handleUseTemplate = (template: Partial<BudgetFormValues>) => {
    setActionError('');
    setEditingBudget(null);
    setTemplateInitialValues(template);
    setDuplicateError('');
    setFormOpen(true);
  };
  useEffect(() => {
    if (loading || !isFinexyActionState(location.state) || location.state.finexyAction !== 'create-budget') return;
    queueMicrotask(openCreate);
    navigate(location.pathname, { replace: true, state: null });
  }, [loading, location.pathname, location.state, navigate]);
  const openEdit = (budget: Budget) => { setActionError(''); setOpenMenuId(null); setEditingBudget(budget); setTemplateInitialValues(undefined); setDuplicateError(''); setFormOpen(true); };
  const saveBudget = async (values: BudgetFormValues) => {
    setActionError('');
    try {
      const limitAmount = parseAmountNumber(values.monthlyLimit);
      if (limitAmount === null) throw new Error('Enter a valid budget limit.');
      if (editingBudget) {
        await updateBudget(editingBudget.id, { period: values.period, limitAmount, currency: values.currency, notes: values.notes.trim() || null });
      } else {
        await createBudget({ categoryId: values.categoryId, period: values.period, limitAmount, currency: values.currency, notes: values.notes.trim() || null });
      }
      closeForm();
      await invalidate(['budgets', 'overview', 'reports', 'categories']);
    } catch (error) {
      setDuplicateError(budgetErrorMessage(error));
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionError('');
    try { await archiveBudget(deleteTarget.id); setDeleteTarget(null); await invalidate(['budgets', 'overview', 'reports', 'categories']); }
    catch (error) { setActionError(budgetErrorMessage(error)); }
  };

  return <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] space-y-6 pb-8 sm:space-y-7">
    <header className="flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-center"><div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight text-primary sm:text-[32px]">Budgets</h1><p className="mt-1 text-xs text-secondary sm:text-sm">Plan spending limits and monitor persisted monthly budgets.</p></div><div className="flex flex-wrap items-center gap-2.5"><Select aria-label="Budget period" value={pageData.period} onChange={(event) => { setActiveFilter('all'); void refresh(event.target.value); }} options={pageData.availablePeriods.map((period) => ({ value: period, label: periodLabel(period) }))} className="h-9 w-auto min-w-[150px] rounded-xl bg-card text-xs" /><Button variant="outline" size="sm" leftIcon={<Icon name="arrow-right" />} onClick={() => navigate('/categories')}>Manage Categories</Button><Button variant="accent" size="sm" leftIcon={<Icon name="plus-lg" />} onClick={openCreate}>Create Budget</Button></div></header>
    {actionError && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{actionError}</div>}
    {loading ? <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-secondary" role="status">Loading budgets…</div> : loadError ? <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/10 p-8 text-center"><p className="text-sm font-semibold text-danger">Could not load budgets</p><p className="mt-1 text-xs text-secondary">{loadError}</p><Button variant="outline" size="sm" className="mt-4" onClick={() => { setLoading(true); void refresh().catch((error: unknown) => setLoadError(budgetErrorMessage(error))).finally(() => setLoading(false)); }}>Try again</Button></div> : <><BudgetSummary summary={pageData.summary} /><div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-5"><div className="xl:col-span-3"><BudgetOverviewCard budgets={pageData.budgets} periodLabel={periodLabel(pageData.period)} /></div><div className="xl:col-span-2"><BudgetInsights budgets={pageData.budgets} /></div></div><section aria-label="Budget list" className="space-y-4"><div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center"><BudgetTabs active={activeFilter} onChange={setActiveFilter} counts={counts} /><div className="flex items-center gap-2"><Input aria-label="Search budgets" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search budgets..." leftIcon={<Search className="h-3.5 w-3.5" />} className="h-9 text-xs" /><Select aria-label="Sort budgets" value={sort} onChange={(event) => setSort(event.target.value)} options={[{ value: 'most-used', label: 'Most Used' }, { value: 'highest-spent', label: 'Highest Spent' }, { value: 'largest-budget', label: 'Largest Budget' }, { value: 'category-name', label: 'Category Name' }]} /></div></div><StableFilterRegion>{pageData.budgets.length === 0 ? <BudgetGrid budgets={[]} categories={pageData.categories} currency={pageData.displayPreferences.reportingCurrency} openMenuId={null} onToggleMenu={() => {}} onView={() => {}} onEdit={() => {}} onDelete={() => {}} onCreate={openCreate} onUseTemplate={handleUseTemplate} /> : visibleBudgets.length ? <BudgetGrid budgets={visibleBudgets} categories={pageData.categories} currency={pageData.displayPreferences.reportingCurrency} openMenuId={openMenuId} onToggleMenu={(id) => setOpenMenuId((current) => current === id ? null : id)} onView={(budget) => { setOpenMenuId(null); setDetailBudget(budget); }} onEdit={openEdit} onDelete={(budget) => { setOpenMenuId(null); setDeleteTarget(budget); }} onUseTemplate={handleUseTemplate} /> : <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center"><p className="text-sm font-semibold text-primary">No budgets match filters</p><p className="mt-1 text-xs text-secondary">No budgets match "{search}" for {periodLabel(pageData.period)}.</p></div>}</StableFilterRegion></section></>}
    {formOpen && <BudgetFormModal key={editingBudget?.id ?? (templateInitialValues ? 'template-budget' : 'new-budget')} budget={editingBudget} initialTemplateValues={templateInitialValues} categories={pageData.categories} periods={pageData.availablePeriods} defaultPeriod={pageData.period} duplicateError={duplicateError} locale={pageData.displayPreferences.locale} numberFormat={pageData.displayPreferences.numberFormat} onClose={closeForm} onSubmit={(values) => void saveBudget(values)} />}<BudgetDetailModal budget={detailBudget} onClose={() => setDetailBudget(null)} /><DeleteBudgetDialog budget={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={() => void confirmDelete()} />
  </div>;
}

export default BudgetsPage;
