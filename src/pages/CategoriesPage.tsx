import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { attachCategoryBudgets, categoryErrorMessage, archiveCategory, buildCategorySummary, createCategory, createCategoryRule, loadCategoriesPage, setCategoryRuleEnabled, updateCategory, type CategoryPageData } from '../lib/categories';
import { loadCategoryBudgetLayer } from '../lib/budgets';
import type { CategoryRule, CategorySummaryData, FinanceCategory } from '../types/categories';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { LoadingState } from '../components/ui/LoadingState';
import {
  CategoryDetailModal,
  CategoryFilters,
  type CategoryFilterValues,
  CategoryFormModal,
  type CategoryFormValues,
  CategoryGrid,
  CategorySummary,
  CategoryTabs,
  type CategoryTab,
  DeleteCategoryDialog,
  RuleEngine,
  RuleFormModal,
  type RuleFormValues,
} from '../components/categories';

const initialFilters: CategoryFilterValues = { search: '', type: 'all', budget: 'all', rules: 'all' };

export function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [summary, setSummary] = useState<CategorySummaryData>(() => buildCategorySummary([]));
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryTab>('expense');
  const [filters, setFilters] = useState<CategoryFilterValues>(initialFilters);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailCategory, setDetailCategory] = useState<FinanceCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinanceCategory | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexFeedback, setReindexFeedback] = useState(false);

  const applyPageData = (data: CategoryPageData) => {
    setCategories(data.categories);
    setRules(data.rules);
    setSummary(data.summary);
    setLoadError(null);
  };

  const loadPageData = async () => {
    const categoryData = await loadCategoriesPage();
    const budgetLayer = await loadCategoryBudgetLayer();
    const categoriesWithBudgets = attachCategoryBudgets(categoryData.categories, budgetLayer.budgets);
    return { ...categoryData, categories: categoriesWithBudgets, summary: buildCategorySummary(categoriesWithBudgets) };
  };

  const refreshData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      applyPageData(await loadPageData());
    } catch (error) {
      setLoadError(categoryErrorMessage(error));
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    void loadPageData()
      .then((data) => {
        if (isActive) applyPageData(data);
      })
      .catch((error: unknown) => {
        if (isActive) setLoadError(categoryErrorMessage(error));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const ruleCounts = useMemo(() => rules.reduce<Record<string, number>>((counts, rule) => {
    if (rule.active) counts[rule.categoryId] = (counts[rule.categoryId] ?? 0) + 1;
    return counts;
  }, {}), [rules]);

  const visibleCategories = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesTab = activeTab === 'all' || category.type === activeTab;
      const matchesType = filters.type === 'all' || category.type === filters.type;
      const matchesBudget = filters.budget === 'all' || (filters.budget === 'has_budget' ? category.type === 'expense' && category.budgetLimit !== undefined : category.type === 'income' || category.budgetLimit === undefined);
      const hasActiveRule = (ruleCounts[category.id] ?? 0) > 0;
      const matchesRules = filters.rules === 'all' || (filters.rules === 'enabled' ? hasActiveRule : !hasActiveRule);
      const categoryRuleValues = rules.filter((rule) => rule.categoryId === category.id).map((rule) => rule.value);
      const searchableText = [category.name, ...category.keywords, ...categoryRuleValues].join(' ').toLowerCase();
      return matchesTab && matchesType && matchesBudget && matchesRules && (!query || searchableText.includes(query));
    });
  }, [activeTab, categories, filters, ruleCounts, rules]);

  const counts = { total: summary.totalCategories, expense: summary.expenseCategoryCount, income: summary.incomeCategoryCount };
  const selectedTabCount = activeTab === 'all' ? counts.total : activeTab === 'expense' ? counts.expense : counts.income;

  const closeCategoryForm = () => { setIsCategoryFormOpen(false); setEditingCategory(null); };
  const openCreateCategory = () => { setActionError(null); setEditingCategory(null); setIsCategoryFormOpen(true); };
  const openEditCategory = (category: FinanceCategory) => { setActionError(null); setOpenMenuId(null); setEditingCategory(category); setIsCategoryFormOpen(true); };

  const saveCategory = async (values: CategoryFormValues) => {
    setActionError(null);
    const input = {
      name: values.name.trim(),
      type: values.type,
      icon: values.icon,
      accent: values.accent,
      keywords: values.keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean),
      status: values.status,
    };
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, input);
      } else {
        await createCategory(input);
      }
      closeCategoryForm();
      await refreshData(false);
    } catch (error) {
      setActionError(categoryErrorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    try {
      await archiveCategory(deleteTarget.id);
      setDeleteTarget(null);
      setOpenMenuId(null);
      await refreshData(false);
    } catch (error) {
      setActionError(categoryErrorMessage(error));
    }
  };

  const addRule = async (values: RuleFormValues) => {
    setActionError(null);
    try {
      await createCategoryRule(values);
      setIsRuleFormOpen(false);
      await refreshData(false);
    } catch (error) {
      setActionError(categoryErrorMessage(error));
    }
  };

  const toggleRule = async (rule: CategoryRule) => {
    setActionError(null);
    try {
      await setCategoryRuleEnabled(rule.id, !rule.active);
      await refreshData(false);
    } catch (error) {
      setActionError(categoryErrorMessage(error));
    }
  };

  const runPrototypeReindex = () => {
    setIsReindexing(true);
    setReindexFeedback(false);
    window.setTimeout(() => { setIsReindexing(false); setReindexFeedback(true); }, 850);
  };

  if (isLoading) {
    return <LoadingState label="Loading your categories" />;
  }

  if (loadError && !categories.length) {
    return <div className="space-y-6"><Card padding="lg"><div className="space-y-3"><p className="text-sm font-semibold text-primary">Categories could not be loaded.</p><p className="text-xs leading-5 text-secondary">{loadError}</p><Button variant="outline" size="sm" onClick={() => void refreshData()}>Try again</Button></div></Card></div>;
  }

  const uncategorizedLabel = summary.uncategorizedCount === null ? '—' : summary.uncategorizedCount;

  return (
    <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] space-y-6 pb-8 animate-in fade-in-50 duration-200 sm:space-y-7">
      <header className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">System <span className="px-1 text-border">/</span> Settings &amp; Structure</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary sm:text-[32px]">Categories</h1>
          <p className="mt-1 text-xs text-secondary sm:text-sm">Category Rules &amp; Budget Taxonomies</p>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-secondary sm:text-sm">Organize, color-tag, and define automated sorting rules for personal transactions across your accounts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" size="sm" leftIcon={<Icon name="arrow-counterclockwise" className={isReindexing ? 'motion-safe:animate-spin' : ''} />} onClick={runPrototypeReindex} disabled={isReindexing}>{isReindexing ? 'Scanning...' : reindexFeedback ? 'Prototype scan complete' : 'Re-index Transactions'}</Button>
          <Button variant="accent" size="sm" leftIcon={<Icon name="plus-lg" />} onClick={openCreateCategory}>Create New Category</Button>
        </div>
      </header>

      {actionError && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{actionError}</div>}
      {loadError && <div role="alert" className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-primary">Some category data may be stale. {loadError}</div>}
      {reindexFeedback && <div role="status" className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-xs font-medium text-[#328864]"><Icon name="check-lg" /> Prototype categorization scan completed. No transaction data was changed.</div>}

      <CategorySummary summary={summary} />

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4" aria-label="Category management">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><CategoryTabs active={activeTab} onChange={setActiveTab} counts={counts} /><p className="shrink-0 text-[11px] text-secondary">Showing {visibleCategories.length} of {selectedTabCount} persisted categories</p></div>
          <CategoryFilters values={filters} onChange={(next) => setFilters((current) => ({ ...current, ...next }))} />
          <CategoryGrid categories={visibleCategories} ruleCounts={ruleCounts} openMenuId={openMenuId} onToggleMenu={(id) => setOpenMenuId((current) => current === id ? null : id)} onView={(category) => { setOpenMenuId(null); setDetailCategory(category); }} onEdit={openEditCategory} onDelete={(category) => { setOpenMenuId(null); setDeleteTarget(category); }} emptyTitle={categories.length ? undefined : 'No categories yet.'} emptyDescription={categories.length ? undefined : 'Create a category to start organizing your transactions.'} />
        </section>

        <aside className="min-w-0 space-y-5">
          <RuleEngine rules={rules} categories={categories} onAdd={() => setIsRuleFormOpen(true)} onToggle={(rule) => void toggleRule(rule)} />
          <Card padding="md" className="min-w-0"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">Pending classification</p><h2 className="mt-1 text-lg font-bold tracking-tight text-primary">Uncategorized Transactions</h2><p className="mt-1 text-xs leading-5 text-secondary">{summary.uncategorizedCount === null ? 'Transaction data remains on the prototype bridge.' : `${summary.uncategorizedCount} items require manual review.`}</p></div><span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-[#9E8314]">{uncategorizedLabel}</span></div><Button variant="outline" size="sm" rightIcon={<Icon name="arrow-right" />} onClick={() => navigate('/transactions')} className="mt-4">Review Transactions</Button></Card>
          <Card padding="md" className="min-w-0 border-accent/20 bg-accent/5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Category organization tip</p><h2 className="mt-1 text-base font-bold text-primary">Keep categories easy to scan</h2><p className="mt-2 text-xs leading-5 text-secondary">Categories with many different merchants may be easier to understand when split into more specific groups.</p></Card>
        </aside>
      </div>

      <CategoryFormModal key={editingCategory?.id ?? 'new-category'} isOpen={isCategoryFormOpen} category={editingCategory} categories={categories} onClose={closeCategoryForm} onSubmit={(values) => void saveCategory(values)} />
      <CategoryDetailModal category={detailCategory} rules={rules} onClose={() => setDetailCategory(null)} />
      <DeleteCategoryDialog category={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={() => void confirmDelete()} />
      <RuleFormModal key={isRuleFormOpen ? 'rule-open' : 'rule-closed'} isOpen={isRuleFormOpen} categories={categories} onClose={() => setIsRuleFormOpen(false)} onSubmit={(values) => void addRule(values)} />
    </div>
  );
}

export default CategoriesPage;
