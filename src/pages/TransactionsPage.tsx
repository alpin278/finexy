import { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import {
  DeleteTransactionDialog,
  TransactionDetailModal,
  TransactionFilters,
  TransactionFormModal,
  TransactionSummary,
  TransactionTable,
  TransactionTabs,
  type TransactionFormValues,
  type TransactionTab,
} from '../components/transactions';
import {
  mockTransactions,
  transactionCategories,
  transactionWallets,
} from '../data/transactions';
import type { Transaction } from '../types/finance';
import { Button } from '../components/ui/Button';

function getCurrencyForWallet(wallet: string): Transaction['currency'] {
  return wallet.includes('EUR') ? 'EUR' : 'USD';
}

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [activeTab, setActiveTab] = useState<TransactionTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [selectedDatePeriod, setSelectedDatePeriod] = useState('this-month');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [exportFeedback, setExportFeedback] = useState(false);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesType = activeTab === 'all' || transaction.type === activeTab;
      const matchesSearch =
        !normalizedQuery ||
        [
          transaction.description,
          transaction.payee,
          transaction.reference,
          transaction.secondaryReference,
          transaction.category,
          transaction.wallet,
          transaction.method,
        ].some((field) => field.toLowerCase().includes(normalizedQuery));
      const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
      const matchesWallet = selectedWallet === 'all' || transaction.wallet === selectedWallet;
      const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
      const matchesDatePeriod =
        selectedDatePeriod === 'year-to-date' ||
        (selectedDatePeriod === 'this-month' && transaction.date.startsWith('2026-04')) ||
        (selectedDatePeriod === 'last-month' && transaction.date.startsWith('2026-03'));

      return matchesType && matchesSearch && matchesCategory && matchesWallet && matchesStatus && matchesDatePeriod;
    });
  }, [
    activeTab,
    searchQuery,
    selectedCategory,
    selectedWallet,
    selectedStatus,
    selectedDatePeriod,
    transactions,
  ]);

  const openAddTransaction = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const openEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const handleSaveTransaction = (values: TransactionFormValues) => {
    const nextTransaction: Transaction = {
      id: editingTransaction?.id ?? `txn-${Date.now()}`,
      description: values.description.trim(),
      payee: values.description.trim(),
      reference: editingTransaction?.reference ?? `INV_${String(Date.now()).slice(-6)}`,
      secondaryReference: values.referenceNote.trim() || 'Manual entry',
      type: values.type,
      category: values.category,
      wallet: values.wallet,
      method: editingTransaction?.method ?? (values.type === 'income' ? 'Manual income' : 'Manual expense'),
      date: values.date,
      time: editingTransaction?.time ?? '12:00 PM',
      amount: Number(values.amount),
      currency: getCurrencyForWallet(values.wallet),
      status: values.status,
    };

    setTransactions((current) => {
      if (editingTransaction) {
        return current.map((transaction) =>
          transaction.id === editingTransaction.id ? nextTransaction : transaction
        );
      }

      return [nextTransaction, ...current];
    });
    handleFormClose();
  };

  const handleDeleteTransaction = () => {
    if (!deletingTransaction) return;

    setTransactions((current) => current.filter((transaction) => transaction.id !== deletingTransaction.id));
    setDeletingTransaction(null);
  };

  const handleExport = () => {
    setExportFeedback(true);
    window.setTimeout(() => setExportFeedback(false), 1800);
  };

  return (
    <div className="min-w-0 w-full max-w-[calc(100vw-2rem)] space-y-6 sm:space-y-7 pb-8 animate-in fade-in-50 duration-200">
      <div className="flex min-w-0 flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 w-full max-w-full">
          <h1 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">Transactions</h1>
          <p className="w-[calc(100vw-4rem)] max-w-full break-words whitespace-normal text-xs sm:w-auto sm:max-w-2xl sm:text-sm text-secondary mt-1">
            Manage, search, and audit all your personal income and expenses across accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExport}
          >
            {exportFeedback ? 'Exported!' : 'Export CSV'}
          </Button>
          <Button
            variant="accent"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={openAddTransaction}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      <TransactionSummary />

      <section aria-label="Transactions list" className="space-y-4">
        <TransactionTabs activeTab={activeTab} onChange={setActiveTab} />

        <TransactionFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          category={selectedCategory}
          onCategoryChange={setSelectedCategory}
          wallet={selectedWallet}
          onWalletChange={setSelectedWallet}
          datePeriod={selectedDatePeriod}
          onDatePeriodChange={setSelectedDatePeriod}
          status={selectedStatus}
          onStatusChange={setSelectedStatus}
          categories={transactionCategories}
          wallets={transactionWallets}
        />

        <TransactionTable
          transactions={filteredTransactions}
          onView={setDetailTransaction}
          onEdit={openEditTransaction}
          onDelete={setDeletingTransaction}
        />
      </section>

      {isFormOpen && (
        <TransactionFormModal
          key={editingTransaction?.id ?? 'new-transaction'}
          isOpen={isFormOpen}
          transaction={editingTransaction}
          onClose={handleFormClose}
          onSubmit={handleSaveTransaction}
        />
      )}

      <TransactionDetailModal
        transaction={detailTransaction}
        onClose={() => setDetailTransaction(null)}
      />

      <DeleteTransactionDialog
        transaction={deletingTransaction}
        onCancel={() => setDeletingTransaction(null)}
        onConfirm={handleDeleteTransaction}
      />
    </div>
  );
}

export default TransactionsPage;
