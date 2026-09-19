import { useMemo, useState } from 'react';
import { ArrowRight, Calendar, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { budgetCategoryOptions, getBudgetStatus, mockBudgets, monthlyBudgetCap } from '../data/budgets';
import type { Budget } from '../types/finance';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { BudgetFormModal, BudgetGrid, BudgetInsights, BudgetOverviewCard, BudgetSummary, BudgetTabs, DeleteBudgetDialog, BudgetDetailModal, type BudgetFilter, type BudgetFormValues } from '../components/budgets';

export function BudgetsPage() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [activeFilter, setActiveFilter] = useState<BudgetFilter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('most-used');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  const counts = useMemo(() => ({ all: budgets.length, on_track: budgets.filter(b => b.status === 'on_track').length, near_limit: budgets.filter(b => b.status === 'near_limit').length, over_budget: budgets.filter(b => b.status === 'over_budget').length }), [budgets]);
  const visibleBudgets = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = budgets.filter(budget => (activeFilter === 'all' || budget.status === activeFilter) && (!query || budget.categoryName.toLowerCase().includes(query)));
    return [...filtered].sort((a, b) => { if (sort === 'highest-spent') return b.spent - a.spent; if (sort === 'largest-budget') return b.monthlyLimit - a.monthlyLimit; if (sort === 'category-name') return a.categoryName.localeCompare(b.categoryName); return (b.spent / b.monthlyLimit) - (a.spent / a.monthlyLimit); });
  }, [activeFilter, budgets, search, sort]);
  const closeForm = () => { setFormOpen(false); setEditingBudget(null); setDuplicateError(''); };
  const openCreate = () => { setEditingBudget(null); setDuplicateError(''); setFormOpen(true); };
  const openEdit = (budget: Budget) => { setOpenMenuId(null); setEditingBudget(budget); setDuplicateError(''); setFormOpen(true); };
  const saveBudget = (values: BudgetFormValues) => {
    const category = budgetCategoryOptions.find(option => option.id === values.categoryId);
    if (!category) return;
    if (!editingBudget && budgets.some(budget => budget.categoryId === values.categoryId && budget.period === values.period)) { setDuplicateError(`${category.name} already has an active budget for this period.`); return; }
    setBudgets(current => editingBudget ? current.map(budget => budget.id === editingBudget.id ? { ...budget, monthlyLimit: Number(values.monthlyLimit), period: values.period, notes: values.notes.trim() || undefined, status: getBudgetStatus(budget.spent, Number(values.monthlyLimit)) } : budget) : [...current, { id: `budget-${Date.now()}`, categoryId: category.id, categoryName: category.name, monthlyLimit: Number(values.monthlyLimit), spent: 0, monthlyAverage: 0, transactionCount: 0, period: values.period, status: 'on_track', icon: category.icon, notes: values.notes.trim() || undefined }]);
    closeForm();
  };
  const confirmDelete = () => { if (!deleteTarget) return; setBudgets(current => current.filter(budget => budget.id !== deleteTarget.id)); setDeleteTarget(null); };

  return <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] space-y-6 sm:space-y-7 pb-8 animate-in fade-in-50 duration-200">
    <header className="flex min-w-0 flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="min-w-0"><h1 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">Budgets</h1><p className="text-xs sm:text-sm text-secondary mt-1">Plan spending limits and monitor your monthly budgets.</p></div><div className="flex items-center gap-2.5 flex-wrap"><Button variant="secondary" size="sm" leftIcon={<Calendar className="w-3.5 h-3.5" />}>This Month</Button><Button variant="outline" size="sm" leftIcon={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => navigate('/categories')}>Manage Categories</Button><Button variant="accent" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Create Budget</Button></div></header>
    <BudgetSummary budgets={budgets} monthlyCap={monthlyBudgetCap} />
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5"><div className="xl:col-span-3"><BudgetOverviewCard budgets={budgets} monthlyCap={monthlyBudgetCap} /></div><div className="xl:col-span-2"><BudgetInsights budgets={budgets} /></div></div>
    <section aria-label="Budget list" className="space-y-4"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><BudgetTabs active={activeFilter} onChange={setActiveFilter} counts={counts} /><div className="flex items-center gap-2"><Input aria-label="Search budgets" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search budgets..." leftIcon={<Search className="w-3.5 h-3.5" />} className="h-9 text-xs" /><Select aria-label="Sort budgets" value={sort} onChange={event => setSort(event.target.value)} options={[{value:'most-used',label:'Most Used'},{value:'highest-spent',label:'Highest Spent'},{value:'largest-budget',label:'Largest Budget'},{value:'category-name',label:'Category Name'}]} /></div></div>{visibleBudgets.length ? <BudgetGrid budgets={visibleBudgets} openMenuId={openMenuId} onToggleMenu={id => setOpenMenuId(current => current === id ? null : id)} onView={budget => { setOpenMenuId(null); setDetailBudget(budget); }} onEdit={openEdit} onDelete={budget => { setOpenMenuId(null); setDeleteTarget(budget); }} /> : <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center"><p className="text-sm font-semibold text-primary">No budgets found</p><p className="mt-1 text-xs text-secondary">Try another filter or search term.</p></div>}</section>
    {formOpen && <BudgetFormModal key={editingBudget?.id ?? 'new-budget'} budget={editingBudget} duplicateError={duplicateError} onClose={closeForm} onSubmit={saveBudget} />}<BudgetDetailModal budget={detailBudget} onClose={() => setDetailBudget(null)} /><DeleteBudgetDialog budget={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
  </div>;
}

export default BudgetsPage;
