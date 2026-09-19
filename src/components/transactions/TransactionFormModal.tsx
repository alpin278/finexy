import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select, type SelectOption } from '../ui/Select';
import type { Transaction, TransactionStatus, TransactionType } from '../../types/finance';
import { transactionStatuses } from '../../data/transactions';

export interface TransactionFormValues {
  type: TransactionType;
  amount: string;
  category: string;
  wallet: string;
  date: string;
  description: string;
  referenceNote: string;
  status: TransactionStatus;
}

export interface TransactionCategoryOption extends SelectOption {
  type: TransactionType;
}

export interface TransactionFormModalProps {
  isOpen: boolean;
  transaction?: Transaction | null;
  categories: readonly TransactionCategoryOption[];
  wallets: readonly SelectOption[];
  onClose: () => void;
  onSubmit: (values: TransactionFormValues) => void;
}

const defaultValues = (categories: readonly TransactionCategoryOption[], wallets: readonly SelectOption[]): TransactionFormValues => ({
  type: 'expense',
  amount: '',
  category: categories.find((category) => category.type === 'expense')?.value ?? '',
  wallet: wallets[0]?.value ?? '',
  date: '2026-04-18',
  description: '',
  referenceNote: '',
  status: 'completed',
});

function getInitialValues(transaction: Transaction | null | undefined, categories: readonly TransactionCategoryOption[], wallets: readonly SelectOption[]): TransactionFormValues {
  if (!transaction) return defaultValues(categories, wallets);

  return {
    type: transaction.type,
    amount: String(transaction.amount),
    category: transaction.category,
    wallet: transaction.wallet,
    date: transaction.date,
    description: transaction.description,
    referenceNote: transaction.secondaryReference,
    status: transaction.status,
  };
}

export function TransactionFormModal({
  isOpen,
  transaction,
  categories,
  wallets,
  onClose,
  onSubmit,
}: TransactionFormModalProps) {
  const [values, setValues] = useState<TransactionFormValues>(() => getInitialValues(transaction, categories, wallets));
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormValues, string>>>({});

  const categoryOptions: SelectOption[] = categories.filter((option) => option.type === values.type).map(({ value, label }) => ({ value, label }));
  const walletOptions: SelectOption[] = wallets.map((wallet) => ({ value: wallet.value, label: wallet.label }));

  const updateValue = <Key extends keyof TransactionFormValues>(key: Key, value: TransactionFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof TransactionFormValues, string>> = {};

    if (!values.type) nextErrors.type = 'Choose a transaction type.';
    if (!values.amount || Number(values.amount) <= 0) nextErrors.amount = 'Enter an amount greater than 0.';
    if (!values.category) nextErrors.category = 'Choose a category.';
    if (!values.wallet) nextErrors.wallet = 'Choose a wallet or account.';
    if (!values.date) nextErrors.date = 'Choose a date.';
    if (!values.description.trim()) nextErrors.description = 'Add a description or payee.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveTransaction = () => {
    if (validate()) onSubmit(values);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveTransaction();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'Add Transaction'}
      description={transaction ? 'Update this persisted ledger transaction.' : 'Record a persisted income or expense.'}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" size="sm" onClick={saveTransaction} type="button">
            {transaction ? 'Save Changes' : 'Save Transaction'}
          </Button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="text-xs font-semibold text-primary mb-2">Transaction Type</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['income', 'expense'] as TransactionType[]).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={values.type === type}
                onClick={() => updateValue('type', type)}
                className={
                  values.type === type
                    ? 'h-10 rounded-xl border border-dark bg-dark text-white text-sm font-semibold cursor-pointer'
                    : 'h-10 rounded-xl border border-border bg-white text-secondary text-sm font-medium hover:bg-surface hover:text-primary cursor-pointer'
                }
              >
                {type === 'income' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>
          {errors.type && <p className="mt-1 text-xs text-danger">{errors.type}</p>}
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="transaction-amount" className="block text-xs font-semibold text-primary mb-1.5">
              Amount
            </label>
            <Input
              id="transaction-amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={values.amount}
              onChange={(event) => updateValue('amount', event.target.value)}
              error={errors.amount}
            />
          </div>
          <div>
            <label htmlFor="transaction-date" className="block text-xs font-semibold text-primary mb-1.5">
              Date
            </label>
            <Input
              id="transaction-date"
              type="date"
              value={values.date}
              onChange={(event) => updateValue('date', event.target.value)}
              error={errors.date}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="transaction-category" className="block text-xs font-semibold text-primary mb-1.5">
              Category
            </label>
            <Select
              id="transaction-category"
              value={values.category}
              onChange={(event) => updateValue('category', event.target.value)}
              options={categoryOptions}
              className="w-full h-10 rounded-[12px] bg-white px-3 pr-8"
              aria-invalid={Boolean(errors.category)}
            />
            {errors.category && <p className="mt-1 text-xs text-danger">{errors.category}</p>}
          </div>
          <div>
            <label htmlFor="transaction-wallet" className="block text-xs font-semibold text-primary mb-1.5">
              Wallet / Account
            </label>
            <Select
              id="transaction-wallet"
              value={values.wallet}
              onChange={(event) => updateValue('wallet', event.target.value)}
              options={walletOptions}
              className="w-full h-10 rounded-[12px] bg-white px-3 pr-8"
              aria-invalid={Boolean(errors.wallet)}
            />
            {errors.wallet && <p className="mt-1 text-xs text-danger">{errors.wallet}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="transaction-description" className="block text-xs font-semibold text-primary mb-1.5">
            Description / Payee
          </label>
          <Input
            id="transaction-description"
            placeholder="e.g. Salary Deposit or Grocery Purchase"
            value={values.description}
            onChange={(event) => updateValue('description', event.target.value)}
            error={errors.description}
          />
        </div>

        <div>
          <label htmlFor="transaction-note" className="block text-xs font-semibold text-primary mb-1.5">
            Reference or Note
          </label>
          <textarea
            id="transaction-note"
            rows={3}
            placeholder="Add a reference, invoice ID, or note"
            value={values.referenceNote}
            onChange={(event) => updateValue('referenceNote', event.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-border rounded-[12px] text-sm text-primary placeholder:text-secondary/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
          />
        </div>

        <div>
          <label htmlFor="transaction-status" className="block text-xs font-semibold text-primary mb-1.5">
            Status
          </label>
          <Select
            id="transaction-status"
            value={values.status}
            onChange={(event) => updateValue('status', event.target.value as TransactionStatus)}
            options={transactionStatuses}
            className="w-full h-10 rounded-[12px] bg-white px-3 pr-8"
          />
        </div>
      </form>
    </Modal>
  );
}

export default TransactionFormModal;
