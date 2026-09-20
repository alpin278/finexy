import { useState } from 'react';
import type { Budget, BudgetCategoryOption, BudgetPeriod, WalletCurrencyCode } from '../../types/finance';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { periodLabel, supportedBudgetCurrencies } from './budgetUtils';

export interface BudgetFormValues {
  categoryId: string;
  monthlyLimit: string;
  period: BudgetPeriod;
  currency: WalletCurrencyCode;
  notes: string;
}

const initialValues = (budget: Budget | null | undefined, defaultPeriod: BudgetPeriod): BudgetFormValues => ({
  categoryId: budget?.categoryId ?? '',
  monthlyLimit: budget ? String(budget.monthlyLimit) : '',
  period: budget?.period ?? defaultPeriod,
  currency: budget?.currency ?? 'USD',
  notes: budget?.notes ?? '',
});

export function BudgetFormModal({ budget, categories, periods, defaultPeriod, duplicateError, onClose, onSubmit }: {
  budget?: Budget | null;
  categories: BudgetCategoryOption[];
  periods: BudgetPeriod[];
  defaultPeriod: BudgetPeriod;
  duplicateError?: string;
  onClose: () => void;
  onSubmit: (values: BudgetFormValues) => void;
}) {
  const [values, setValues] = useState(() => initialValues(budget, defaultPeriod));
  const [errors, setErrors] = useState<Partial<Record<keyof BudgetFormValues, string>>>({});
  const update = <K extends keyof BudgetFormValues>(key: K, value: BudgetFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const save = () => {
    const next: typeof errors = {};
    if (!values.categoryId) next.categoryId = 'Choose an expense category.';
    if (!values.monthlyLimit || !Number.isFinite(Number(values.monthlyLimit)) || Number(values.monthlyLimit) <= 0) next.monthlyLimit = 'Enter a monthly limit greater than 0.';
    if (!values.period) next.period = 'Choose a budget period.';
    if (!values.currency) next.currency = 'Choose a currency.';
    setErrors(next);
    if (!Object.keys(next).length) onSubmit(values);
  };
  const periodOptions = [...new Set([values.period, ...periods])].sort((a, b) => b.localeCompare(a)).map((period) => ({ value: period, label: periodLabel(period) }));
  return <Modal isOpen onClose={onClose} title={budget ? 'Edit Budget' : 'Create Budget'} description={budget ? 'Update persisted budget configuration; usage is derived from the ledger.' : 'Set a persisted monthly spending limit for an expense category.'} maxWidth="md" footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button variant="accent" size="sm" onClick={save}>{budget ? 'Save Changes' : 'Create Budget'}</Button></>}>
    <form onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-4">
      <div><label htmlFor="budget-category" className="mb-1.5 block text-xs font-semibold text-primary">Category</label><Select id="budget-category" value={values.categoryId} disabled={Boolean(budget)} onChange={(event) => update('categoryId', event.target.value)} options={[{ value: '', label: 'Choose an expense category' }, ...categories.map((category) => ({ value: category.id, label: category.name }))]} className="h-10 w-full rounded-[12px] bg-white" aria-invalid={Boolean(errors.categoryId)} />{errors.categoryId && <p className="mt-1 text-xs text-danger">{errors.categoryId}</p>}{duplicateError && <p role="alert" className="mt-1 text-xs text-danger">{duplicateError}</p>}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor="budget-limit" className="mb-1.5 block text-xs font-semibold text-primary">Monthly Budget Limit</label><Input id="budget-limit" type="number" min="0.01" step="0.01" inputMode="decimal" value={values.monthlyLimit} onChange={(event) => update('monthlyLimit', event.target.value)} placeholder="0.00" error={errors.monthlyLimit} /></div><div><label htmlFor="budget-currency" className="mb-1.5 block text-xs font-semibold text-primary">Currency</label><Select id="budget-currency" value={values.currency} onChange={(event) => update('currency', event.target.value as WalletCurrencyCode)} options={supportedBudgetCurrencies.map((currency) => ({ value: currency, label: currency }))} className="h-10 w-full rounded-[12px] bg-white" aria-invalid={Boolean(errors.currency)} />{errors.currency && <p className="mt-1 text-xs text-danger">{errors.currency}</p>}</div></div>
      <div><label htmlFor="budget-period" className="mb-1.5 block text-xs font-semibold text-primary">Period</label><Select id="budget-period" value={values.period} onChange={(event) => update('period', event.target.value)} options={periodOptions} className="h-10 w-full rounded-[12px] bg-white" aria-invalid={Boolean(errors.period)} />{errors.period && <p className="mt-1 text-xs text-danger">{errors.period}</p>}</div>
      <div><label htmlFor="budget-notes" className="mb-1.5 block text-xs font-semibold text-primary">Notes <span className="font-normal text-secondary">(optional)</span></label><textarea id="budget-notes" rows={3} maxLength={500} value={values.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Add a note for this budget" className="w-full resize-y rounded-[12px] border border-border bg-white px-3.5 py-2.5 text-sm text-primary placeholder:text-secondary/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" /></div>
    </form>
  </Modal>;
}
