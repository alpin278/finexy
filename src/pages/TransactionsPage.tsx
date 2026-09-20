import { useEffect, useMemo, useState } from 'react';
import { DeleteTransactionDialog, TransactionDetailModal, TransactionFilters, TransactionFormModal, TransactionSummary, TransactionTable, TransactionTabs, RecurringTransactions, type TransactionCategoryOption, type TransactionFormValues, type TransactionTab } from '../components/transactions';
import { archiveTransaction, createTransaction, loadTransactionsPage, transactionErrorMessage, updateTransaction, type TransactionPageData } from '../lib/transactions';
import type { Transaction } from '../types/finance';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';

const emptyData: TransactionPageData = { transactions: [], categories: [], wallets: [], summary: { count: 0, income: {}, expenses: {}, net: {} } };

export function TransactionsPage() {
  const [pageData, setPageData] = useState<TransactionPageData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [activeTab, setActiveTab] = useState<TransactionTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [selectedDatePeriod, setSelectedDatePeriod] = useState('year-to-date');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [exportFeedback, setExportFeedback] = useState(false);

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

  const refresh = async () => {
    const data = await loadTransactionsPage();
    setPageData(data);
    if (detailTransaction) setDetailTransaction(data.transactions.find((transaction) => transaction.id === detailTransaction.id) ?? null);
  };
  const openAddTransaction = () => { setActionError(''); setEditingTransaction(null); setIsFormOpen(true); };
  const openEditTransaction = (transaction: Transaction) => { setActionError(''); setEditingTransaction(transaction); setIsFormOpen(true); };
  const handleFormClose = () => { setIsFormOpen(false); setEditingTransaction(null); };
  const handleSaveTransaction = async (values: TransactionFormValues) => {
    setActionError('');
    try {
      const wallet = pageData.wallets.find((item) => item.name === values.wallet);
      const type = values.type === 'income' ? 'income' : 'expense';
      const category = pageData.categories.find((item) => item.name === values.category && item.type === type);
      if (!wallet || !category) throw new Error(`Choose a valid ${values.type} category and wallet.`);
      const input = { walletId: wallet.id, categoryId: category.id, type, amount: Number(values.amount), currency: wallet.currency, payee: values.description, description: values.description, note: values.referenceNote, occurredAt: `${values.date}T12:00:00Z`, status: values.status === 'canceled' ? 'canceled' : values.status === 'completed' ? 'completed' : 'pending' } as const;
      if (editingTransaction) await updateTransaction(editingTransaction.id, input);
      else await createTransaction(input);
      await refresh();
      handleFormClose();
    } catch (error) { setActionError(transactionErrorMessage(error)); }
  };
  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;
    setActionError('');
    try { await archiveTransaction(deletingTransaction.id); await refresh(); setDeletingTransaction(null); }
    catch (error) { setActionError(transactionErrorMessage(error)); }
  };
  const handleExport = () => { setExportFeedback(true); window.setTimeout(() => setExportFeedback(false), 1800); };

  const categoryOptions: TransactionCategoryOption[] = pageData.categories.map((category) => ({ value: category.name, label: category.name, type: category.type }));
  const categoryNames = [...new Set(pageData.categories.map((category) => category.name))];
  const walletNames = pageData.wallets.map((wallet) => wallet.name);
  const filteredTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return pageData.transactions.filter((transaction) => {
      const matchesType = activeTab === 'all' || transaction.type === activeTab;
      const matchesSearch = !normalizedQuery || [transaction.description, transaction.payee, transaction.reference, transaction.secondaryReference, transaction.category, transaction.wallet, transaction.method].some((field) => field.toLowerCase().includes(normalizedQuery));
      const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
      const matchesWallet = selectedWallet === 'all' || transaction.wallet === selectedWallet;
      const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const lastMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const lastMonth = lastMonthDate.toISOString().slice(0, 7);
      const matchesDatePeriod = selectedDatePeriod === 'year-to-date' ? transaction.date.startsWith(String(now.getUTCFullYear())) : selectedDatePeriod === 'this-month' ? transaction.date.startsWith(currentMonth) : transaction.date.startsWith(lastMonth);
      return matchesType && matchesSearch && matchesCategory && matchesWallet && matchesStatus && matchesDatePeriod;
    });
  }, [activeTab, pageData.transactions, searchQuery, selectedCategory, selectedWallet, selectedStatus, selectedDatePeriod]);

  return <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] space-y-6 sm:space-y-7 pb-8">
    <div className="flex min-w-0 flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="min-w-0 w-full max-w-full"><h1 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">Transactions</h1><p className="w-[calc(100vw-4rem)] max-w-full break-words whitespace-normal text-xs sm:w-auto sm:max-w-2xl sm:text-sm text-secondary mt-1">Manage, search, and audit your persisted personal income and expenses.</p></div><div className="flex items-center gap-2.5 flex-wrap"><Button variant="secondary" size="sm" leftIcon={<Icon name="download" />} onClick={handleExport}>{exportFeedback ? 'Exported!' : 'Export CSV'}</Button><Button variant="accent" size="sm" leftIcon={<Icon name="plus-lg" />} onClick={openAddTransaction}>Add Transaction</Button></div></div>
    {actionError && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{actionError}</div>}
    {loading ? <div role="status" className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-secondary">Loading transactions…</div> : loadError ? <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/10 p-8 text-center"><p className="text-sm font-semibold text-danger">Could not load transactions</p><p className="mt-1 text-xs text-secondary">{loadError}</p></div> : <><TransactionSummary summary={pageData.summary}/><RecurringTransactions wallets={pageData.wallets} categories={pageData.categories} onChanged={refresh}/><section aria-label="Transactions list" className="space-y-4"><TransactionTabs activeTab={activeTab} onChange={setActiveTab} counts={{ all: pageData.transactions.length, income: pageData.transactions.filter((transaction) => transaction.type === 'income').length, expense: pageData.transactions.filter((transaction) => transaction.type === 'expense').length }}/><TransactionFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} category={selectedCategory} onCategoryChange={setSelectedCategory} wallet={selectedWallet} onWalletChange={setSelectedWallet} datePeriod={selectedDatePeriod} onDatePeriodChange={setSelectedDatePeriod} status={selectedStatus} onStatusChange={setSelectedStatus} categories={categoryNames} wallets={walletNames}/><TransactionTable transactions={filteredTransactions} onView={setDetailTransaction} onEdit={openEditTransaction} onDelete={setDeletingTransaction}/></section></>}
    {isFormOpen && <TransactionFormModal key={editingTransaction?.id ?? 'new-transaction'} isOpen={isFormOpen} transaction={editingTransaction} categories={categoryOptions} wallets={walletNames.map((name) => ({ value: name, label: name }))} onClose={handleFormClose} onSubmit={(values) => void handleSaveTransaction(values)}/>}<TransactionDetailModal transaction={detailTransaction} onClose={() => setDetailTransaction(null)}/><DeleteTransactionDialog transaction={deletingTransaction} onCancel={() => setDeletingTransaction(null)} onConfirm={() => void handleDeleteTransaction()}/>
  </div>;
}

export default TransactionsPage;
