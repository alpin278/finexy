import { useEffect, useMemo, useState } from 'react';
import { useCallback } from 'react';
import { BankStatementImportModal, DeleteTransactionDialog, TransactionDetailModal, TransactionExportModal, TransactionFilters, TransactionFormModal, TransactionSummary, TransactionTable, TransactionTabs, RecurringTransactions, type TransactionCategoryOption, type TransactionFormValues, type TransactionTab } from '../components/transactions';
import { archiveTransaction, createTransaction, loadTransactionsPage, transactionErrorMessage, updateTransaction, type TransactionPageData } from '../lib/transactions';
import type { CurrencyCode, Transaction } from '../types/finance';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { downloadTransactionsCsv, type TransactionExportFilters } from '../lib/transaction-export';
import { parseAmountNumber } from '../lib/amount-format';
import { StableFilterRegion } from '../components/ui/StableFilterRegion';
import { useLocation, useNavigate } from 'react-router-dom';
import { isFinexyActionState } from '../lib/interaction-actions';
import { useDataInvalidation, useDataRevalidation } from '../context/DataRevalidationContext';
import { occurredAtForTransactionDate } from '../lib/transaction-timestamp';
import { getExportDateRangeForPeriod, getTransactionDateFilterBounds, matchesTransactionDatePeriod } from '../lib/transaction-date-filter';

const emptyData: TransactionPageData = { transactions: [], categories: [], wallets: [], summary: { count: 0, income: {}, expenses: {}, net: {} }, reportingCurrency: 'USD', numberLocale: 'en-US', numberFormat: '1,234.56' };

export function TransactionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState<TransactionPageData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const [activeTab, setActiveTab] = useState<TransactionTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [selectedDatePeriod, setSelectedDatePeriod] = useState('all-dates');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [exportFeedback, setExportFeedback] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activityCurrency, setActivityCurrency] = useState<'all' | CurrencyCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recurringSignal, setRecurringSignal] = useState(0);
  const invalidate = useDataInvalidation();

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await loadTransactionsPage();
        if (active) { setPageData(data); setLoadError(''); }
      } catch (error) {
        if (active) setLoadError(transactionErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async () => {
    const data = await loadTransactionsPage();
    setPageData(data);
    setDetailTransaction((current) => current ? data.transactions.find((transaction) => transaction.id === current.id) ?? null : null);
  }, []);
  useDataRevalidation(['transactions', 'wallets', 'categories', 'settings'], refresh);
  const openAddTransaction = () => { setActionError(''); setEditingTransaction(null); setIsFormOpen(true); };
  const openEditTransaction = (transaction: Transaction) => { setActionError(''); setEditingTransaction(transaction); setIsFormOpen(true); };
  const handleFormClose = () => { setIsFormOpen(false); setEditingTransaction(null); };
  useEffect(() => {
    if (loading || !isFinexyActionState(location.state)) return;
    const action = location.state.finexyAction;
    const requestId = location.state.requestId;
    queueMicrotask(() => {
      if (action === 'new-transaction') openAddTransaction();
      else if (action === 'add-recurring') setRecurringSignal(requestId);
      else if (action === 'export-transactions') setIsExportOpen(true);
    });
    if (action === 'new-transaction' || action === 'add-recurring' || action === 'export-transactions') navigate(location.pathname, { replace: true, state: null });
  }, [loading, location.pathname, location.state, navigate]);
  const handleSaveTransaction = async (values: TransactionFormValues) => {
    setActionError('');
    setSubmitting(true);
    try {
      const wallet = pageData.wallets.find((item) => item.name === values.wallet);
      const type = values.type === 'income' ? 'income' : 'expense';
      const category = pageData.categories.find((item) => item.name === values.category && item.type === type);
      if (!wallet || !category) throw new Error(`Choose a valid ${values.type} category and wallet.`);
      const amount = parseAmountNumber(values.amount);
      if (amount === null) throw new Error('Enter a valid transaction amount.');
      const input = { walletId: wallet.id, categoryId: category.id, type, amount, currency: wallet.currency, payee: values.description, description: values.description, note: values.referenceNote, occurredAt: occurredAtForTransactionDate(values.date), status: values.status === 'canceled' ? 'canceled' : values.status === 'completed' ? 'completed' : 'pending' } as const;
      const splits = values.splits.length ? values.splits.map((split) => {
        const splitCategory = pageData.categories.find((item) => item.name === split.category && item.type === type);
        if (!splitCategory) throw new Error('Choose a valid category for every split allocation.');
        return { categoryId: splitCategory.id, amount: split.amount };
      }) : undefined;
      if (editingTransaction) await updateTransaction(editingTransaction.id, input, splits);
      else await createTransaction(input, splits);
      await invalidate(['transactions', 'wallets', 'budgets', 'overview', 'reports', 'categories']);
      setActionFeedback(editingTransaction ? 'Transaction updated.' : 'Transaction recorded.');
      window.setTimeout(() => setActionFeedback(''), 2400);
      handleFormClose();
    } catch (error) { setActionError(transactionErrorMessage(error)); }
    finally { setSubmitting(false); }
  };
  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;
    setActionError('');
    try { await archiveTransaction(deletingTransaction.id); await invalidate(['transactions', 'wallets', 'budgets', 'overview', 'reports', 'categories']); setDeletingTransaction(null); setActionFeedback('Transaction archived.'); window.setTimeout(() => setActionFeedback(''), 2400); }
    catch (error) { setActionError(transactionErrorMessage(error)); }
  };
  const exportDateDefaults = (): Pick<TransactionExportFilters, 'dateFrom' | 'dateTo'> => {
    return getExportDateRangeForPeriod(selectedDatePeriod);
  };
  const handleExport = (filters: TransactionExportFilters) => {
    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) { setActionError('The export start date must be on or before the end date.'); return; }
    setActionError('');
    const count = downloadTransactionsCsv(pageData.transactions, filters);
    setExportFeedback(`${count} row${count === 1 ? '' : 's'} exported`);
    window.setTimeout(() => setExportFeedback(''), 2200);
  };

  const categoryOptions: TransactionCategoryOption[] = pageData.categories.map((category) => ({ value: category.name, label: category.name, type: category.type }));
  const categoryNames = [...new Set(pageData.categories.map((category) => category.name))];
  const walletNames = pageData.wallets.map((wallet) => wallet.name);
  const activityCurrencies = useMemo(() => [...new Set(pageData.transactions.map((transaction) => transaction.currency))].sort() as CurrencyCode[], [pageData.transactions]);
  // Activity is an audit stream, not a reporting aggregate: retain every
  // canonical native-currency event unless the user explicitly filters it.
  const activeActivityCurrency = activityCurrency ?? 'all';

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const dateBounds = getTransactionDateFilterBounds();
    return pageData.transactions.filter((transaction) => {
      const matchesTab = activeTab === 'all' || transaction.type === activeTab;
      const matchesSearch = !normalizedQuery || [transaction.description, transaction.payee, transaction.reference, transaction.secondaryReference, transaction.category, transaction.wallet, transaction.method].some((field) => field.toLowerCase().includes(normalizedQuery));
      const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
      const matchesWallet = selectedWallet === 'all' || transaction.wallet === selectedWallet || transaction.transferSourceWallet === selectedWallet || transaction.transferDestinationWallet === selectedWallet;
      const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
      const matchesCurrency = activeActivityCurrency === 'all' || transaction.currency === activeActivityCurrency;
      const matchesDate = matchesTransactionDatePeriod(transaction.date, selectedDatePeriod, dateBounds);
      return matchesTab && matchesSearch && matchesCategory && matchesWallet && matchesStatus && matchesCurrency && matchesDate;
    });
  }, [activeActivityCurrency, activeTab, pageData.transactions, searchQuery, selectedCategory, selectedWallet, selectedStatus, selectedDatePeriod]);

  return <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] space-y-6 sm:space-y-7 pb-8">
    <div className="flex min-w-0 flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="min-w-0 w-full max-w-full"><h1 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">Transactions</h1><p className="w-[calc(100vw-4rem)] max-w-full break-words whitespace-normal text-xs sm:w-auto sm:max-w-2xl sm:text-sm text-secondary mt-1">Manage, search, and audit income, expenses, and wallet transfer activity.</p></div><div className="flex items-center gap-2.5 flex-wrap"><Button variant="secondary" size="sm" leftIcon={<Icon name="upload" />} onClick={() => setIsImportOpen(true)}>Import statement</Button><Button variant="secondary" size="sm" leftIcon={<Icon name="download" />} onClick={() => setIsExportOpen(true)}>{exportFeedback || 'Export CSV'}</Button><Button variant="accent" size="sm" leftIcon={<Icon name="plus-lg" />} onClick={openAddTransaction}>Add Transaction</Button></div></div>
    {actionError && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{actionError}</div>}
    {actionFeedback && <div role="status" className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">{actionFeedback}</div>}
    {loading ? <div role="status" className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-secondary">Loading transactions…</div> : loadError ? <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/10 p-8 text-center"><p className="text-sm font-semibold text-danger">Could not load transactions</p><p className="mt-1 text-xs text-secondary">{loadError}</p></div> : <><TransactionSummary summary={pageData.summary} reportingCurrency={pageData.reportingCurrency}/><RecurringTransactions wallets={pageData.wallets} categories={pageData.categories} locale={pageData.numberLocale} numberFormat={pageData.numberFormat} onChanged={refresh} openCreateSignal={recurringSignal}/><section aria-label="Transactions list" className="space-y-4"><TransactionTabs activeTab={activeTab} onChange={setActiveTab} counts={{ all: pageData.transactions.length, income: pageData.transactions.filter((transaction) => transaction.type === 'income').length, expense: pageData.transactions.filter((transaction) => transaction.type === 'expense').length }}/><TransactionFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} category={selectedCategory} onCategoryChange={setSelectedCategory} wallet={selectedWallet} onWalletChange={setSelectedWallet} datePeriod={selectedDatePeriod} onDatePeriodChange={setSelectedDatePeriod} status={selectedStatus} onStatusChange={setSelectedStatus} categories={categoryNames} wallets={walletNames} currency={activeActivityCurrency} onCurrencyChange={setActivityCurrency} currencies={activityCurrencies} reportingCurrency={pageData.reportingCurrency}/><StableFilterRegion><TransactionTable transactions={filteredTransactions} onView={setDetailTransaction} onEdit={openEditTransaction} onDelete={setDeletingTransaction} onCreate={openAddTransaction}/></StableFilterRegion></section></>}
    {isFormOpen && <TransactionFormModal key={editingTransaction?.id ?? 'new-transaction'} isOpen={isFormOpen} transaction={editingTransaction} categories={categoryOptions} wallets={walletNames.map((name) => ({ value: name, label: name }))} locale={pageData.numberLocale} numberFormat={pageData.numberFormat} submitting={submitting} onClose={handleFormClose} onSubmit={(values) => void handleSaveTransaction(values)}/>}<TransactionDetailModal transaction={detailTransaction} onClose={() => setDetailTransaction(null)}/><DeleteTransactionDialog transaction={deletingTransaction} onCancel={() => setDeletingTransaction(null)} onConfirm={() => void handleDeleteTransaction()}/><TransactionExportModal key={isExportOpen ? 'export-open' : 'export-closed'} isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} onExport={handleExport} categories={categoryNames} wallets={walletNames} initialFilters={{ ...exportDateDefaults(), type: activeTab === 'all' ? 'all' : activeTab, wallet: selectedWallet, category: selectedCategory, status: selectedStatus as TransactionExportFilters['status'] }}/><BankStatementImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} wallets={pageData.wallets} categories={pageData.categories} onImported={async () => { await invalidate(['transactions', 'wallets', 'budgets', 'overview', 'reports', 'categories']); setActionFeedback('Bank statement imported.'); window.setTimeout(() => setActionFeedback(''), 2400); }}/>
  </div>;
}

export default TransactionsPage;
