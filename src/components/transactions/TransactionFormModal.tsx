import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { AmountInput } from '../ui/AmountInput';
import { Modal } from '../ui/Modal';
import { Select, type SelectOption } from '../ui/Select';
import { Icon } from '../ui/Icon';
import type { Transaction, TransactionStatus, TransactionType } from '../../types/finance';
import { transactionStatuses } from '../../data/transactions';
import { parseAmountNumber } from '../../lib/amount-format';

export interface TransactionFormValues {
  type: TransactionType;
  amount: string;
  category: string;
  wallet: string;
  date: string;
  description: string;
  referenceNote: string;
  status: TransactionStatus;
  splits: Array<{ category: string; amount: string }>;
}

export interface TransactionCategoryOption extends SelectOption {
  type: TransactionType;
}

export interface TransactionFormModalProps {
  isOpen: boolean;
  transaction?: Transaction | null;
  categories: readonly TransactionCategoryOption[];
  wallets: readonly SelectOption[];
  locale: string;
  numberFormat: string;
  onClose: () => void;
  onSubmit: (values: TransactionFormValues) => void;
  submitting?: boolean;
}

function currentLocalDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const defaultValues = (categories: readonly TransactionCategoryOption[], wallets: readonly SelectOption[]): TransactionFormValues => ({
  type: 'expense',
  amount: '',
  category: categories.find((category) => category.type === 'expense')?.value ?? '',
  wallet: wallets[0]?.value ?? '',
  // Use the user's local calendar day so a newly recorded web entry is ordered
  // with current activity instead of inheriting the fixed prototype seed date.
  date: currentLocalDate(),
  description: '',
  referenceNote: '',
  status: 'completed',
  splits: [],
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
    splits: transaction.splits?.map((split) => ({ category: split.category, amount: String(split.amount) })) ?? [],
  };
}

export function TransactionFormModal({
  isOpen,
  transaction,
  categories,
  wallets,
  locale,
  numberFormat,
  onClose,
  onSubmit,
  submitting = false,
}: TransactionFormModalProps) {
  const navigate = useNavigate();
  const [values, setValues] = useState<TransactionFormValues>(() => getInitialValues(transaction, categories, wallets));
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormValues, string>>>({});

  const manageCategoriesAction = {
    label: 'Manage Categories',
    icon: <Icon name="tags" />,
    onSelect: () => {
      onClose();
      navigate('/settings#categories');
    },
  };

  const categoryOptions: SelectOption[] = categories.filter((option) => option.type === values.type).map(({ value, label }) => ({ value, label }));
  const walletOptions: SelectOption[] = wallets.map((wallet) => ({ value: wallet.value, label: wallet.label }));

  const updateValue = <Key extends keyof TransactionFormValues>(key: Key, value: TransactionFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof TransactionFormValues, string>> = {};

    if (!values.type) nextErrors.type = 'Choose a transaction type.';
    const amount = parseAmountNumber(values.amount);
    if (amount === null || amount <= 0) nextErrors.amount = 'Enter an amount greater than 0.';
    if (!values.category) nextErrors.category = 'Choose a category.';
    if (!values.wallet) nextErrors.wallet = 'Choose a wallet or account.';
    if (!values.date) nextErrors.date = 'Choose a date.';
    if (!values.description.trim()) nextErrors.description = 'Add a description or payee.';
    if (values.splits.length) {
      const units = (value: string) => { const [whole, fraction = ''] = value.split('.'); return BigInt(`${whole || '0'}${fraction.padEnd(4, '0').slice(0, 4)}`); };
      const total = parseAmountNumber(values.amount);
      if (values.splits.length < 2) nextErrors.splits = 'Add at least two categories to split this transaction.';
      else if (values.splits.some((split) => !split.category || parseAmountNumber(split.amount) === null || Number(split.amount) <= 0)) nextErrors.splits = 'Choose a category and valid amount for every allocation.';
      else if (total !== null && values.splits.reduce((sum, split) => sum + units(split.amount), 0n) !== units(values.amount)) nextErrors.splits = 'Split allocations must equal the transaction total exactly.';
    }

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
          <Button variant="outline" size="sm" onClick={onClose} type="button" disabled={submitting}>
            Cancel
          </Button>
          <Button variant="accent" size="sm" onClick={saveTransaction} type="button" loading={submitting}>
            {transaction ? 'Save Changes' : 'Save Transaction'}
          </Button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="text-xs font-semibold text-primary mb-2">Transaction Type</legend>
          <div className="isolate grid grid-cols-2 gap-1 overflow-hidden rounded-[14px] border border-border dark:border-[#2C2C26] bg-surface dark:bg-[#181815] p-1">
            {(['income', 'expense'] as TransactionType[]).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={values.type === type}
                onClick={() => updateValue('type', type)}
                className={
                  values.type === type
                    ? 'h-10 rounded-[10px] border border-dark/10 dark:border-[#3E3E34] bg-dark dark:bg-[#2C2C26] text-white dark:text-[#F2F2EE] text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(23,23,20,0.12)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.3)] transition-[background-color,color,box-shadow] duration-200 cursor-pointer'
                    : 'h-10 rounded-[10px] border border-transparent bg-transparent text-secondary dark:text-[#8E8E86] text-sm font-medium transition-[background-color,color,box-shadow] duration-200 hover:bg-card dark:hover:bg-[#22221E] hover:text-primary dark:hover:text-[#D4D4CE] cursor-pointer'
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
            <AmountInput
              id="transaction-amount"
              min="0.01"
              placeholder="0.00"
              value={values.amount}
              onValueChange={(amount) => updateValue('amount', amount)}
              locale={locale}
              numberFormat={numberFormat}
              maximumFractionDigits={2}
              error={errors.amount}
            />
          </div>
          <div>
            <label htmlFor="transaction-date" className="block text-xs font-semibold text-primary mb-1.5">
              Date
            </label>
            <DatePicker
              id="transaction-date"
              value={values.date}
              onChange={(date) => updateValue('date', date)}
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
              action={manageCategoriesAction}
              className="w-full h-10 rounded-[12px] bg-card dark:bg-[#1A1A17] px-3 pr-8"
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
              className="w-full h-10 rounded-[12px] bg-card dark:bg-[#1A1A17] px-3 pr-8"
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

        <section className="rounded-2xl border border-border dark:border-[#2E2E28] bg-surface dark:bg-[#1A1A17] p-3.5" aria-label="Split transaction allocations">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-primary dark:text-[#F2F2EE]">Split transaction</p>
              <p className="mt-0.5 text-[11px] text-secondary dark:text-[#8E8E86]">Allocate this one wallet transaction across categories.</p>
            </div>
            <button
              type="button"
              onClick={() => updateValue('splits', values.splits.length ? [] : [{ category: values.category, amount: '' }, { category: '', amount: '' }])}
              className="rounded-full border border-border dark:border-[#383830] bg-card dark:bg-[#262622] px-3 py-1.5 text-xs font-semibold text-primary dark:text-[#D4D4CE] hover:border-accent/40 cursor-pointer"
            >
              {values.splits.length ? 'Use one category' : 'Split transaction'}
            </button>
          </div>
          {values.splits.length ? (
            <div className="mt-3 space-y-2.5">
              {values.splits.map((split, index) => (
                <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto] gap-2">
                  <Select
                    aria-label={`Split category ${index + 1}`}
                    value={split.category}
                    onChange={(event) => updateValue('splits', values.splits.map((item, itemIndex) => itemIndex === index ? { ...item, category: event.target.value } : item))}
                    options={categoryOptions}
                    action={manageCategoriesAction}
                    className="h-10 min-w-0 bg-card dark:bg-[#1A1A17]"
                  />
                  <AmountInput
                    id={`split-amount-${index}`}
                    aria-label={`Split amount ${index + 1}`}
                    value={split.amount}
                    onValueChange={(amount) => updateValue('splits', values.splits.map((item, itemIndex) => itemIndex === index ? { ...item, amount } : item))}
                    locale={locale}
                    numberFormat={numberFormat}
                    maximumFractionDigits={4}
                  />
                  <button
                    type="button"
                    aria-label={`Remove split ${index + 1}`}
                    onClick={() => updateValue('splits', values.splits.filter((_, itemIndex) => itemIndex !== index))}
                    className="h-10 w-10 rounded-xl border border-border dark:border-[#32322A] bg-card dark:bg-[#1A1A17] text-secondary dark:text-[#9C9C94] hover:text-danger dark:hover:text-danger cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateValue('splits', [...values.splits, { category: '', amount: '' }])}
                className="text-xs font-semibold text-accent hover:text-accent-hover cursor-pointer"
              >
                + Add allocation
              </button>
              {errors.splits && <p className="text-xs text-danger">{errors.splits}</p>}
            </div>
          ) : null}
        </section>

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
            className="w-full resize-y rounded-[12px] border border-border dark:border-[#32322A] bg-card dark:bg-[#1A1A17] px-3.5 py-2.5 text-sm text-primary dark:text-[#F2F2EE] placeholder:text-secondary/70 dark:placeholder:text-[#787870] transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 dark:focus:ring-accent/25"
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
            className="w-full h-10 rounded-[12px] bg-card dark:bg-[#1A1A17] px-3 pr-8"
          />
        </div>
      </form>
    </Modal>
  );
}

export default TransactionFormModal;
