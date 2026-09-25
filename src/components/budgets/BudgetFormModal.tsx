import { useState } from 'react';
import type { Budget, BudgetCategoryOption, BudgetPeriod, WalletCurrencyCode } from '../../types/finance';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { supportedBudgetCurrencies } from './budgetUtils';
import { parseAmountNumber } from '../../lib/amount-format';
import { isBudgetPeriod } from '../../lib/budget-utils';

export interface BudgetFormValues {
  categoryId: string;
  monthlyLimit: string;
  period: BudgetPeriod;
  currency: WalletCurrencyCode;
  notes: string;
}

const initialValues = (budget: Budget | null | undefined, defaultPeriod: BudgetPeriod, template?: Partial<BudgetFormValues>): BudgetFormValues => ({
  categoryId: budget?.categoryId ?? template?.categoryId ?? '',
  monthlyLimit: budget ? String(budget.monthlyLimit) : (template?.monthlyLimit ?? ''),
  period: budget?.period ?? template?.period ?? defaultPeriod,
  currency: budget?.currency ?? template?.currency ?? 'USD',
  notes: budget?.notes ?? template?.notes ?? '',
});

const monthOptions = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

export function BudgetFormModal({ budget, initialTemplateValues, categories, periods, defaultPeriod, duplicateError, locale, numberFormat, onClose, onSubmit }: {
  budget?: Budget | null;
  initialTemplateValues?: Partial<BudgetFormValues>;
  categories: BudgetCategoryOption[];
  periods: BudgetPeriod[];
  defaultPeriod: BudgetPeriod;
  duplicateError?: string;
  locale: string;
  numberFormat: string;
  onClose: () => void;
  onSubmit: (values: BudgetFormValues) => void;
}) {
  const [values, setValues] = useState(() => initialValues(budget, defaultPeriod, initialTemplateValues));
  const [errors, setErrors] = useState<Partial<Record<keyof BudgetFormValues, string>>>({});
  const update = <K extends keyof BudgetFormValues>(key: K, value: BudgetFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const save = () => {
    const next: typeof errors = {};
    if (!values.categoryId) next.categoryId = 'Choose an expense category.';
    const monthlyLimit = parseAmountNumber(values.monthlyLimit);
    if (monthlyLimit === null || monthlyLimit <= 0) next.monthlyLimit = 'Enter a monthly limit greater than 0.';
    if (!values.period) next.period = 'Choose a budget period.';
    if (!values.currency) next.currency = 'Choose a currency.';
    setErrors(next);
    if (!Object.keys(next).length) onSubmit(values);
  };
  const selectedYear = values.period.slice(0, 4);
  const selectedMonth = values.period.slice(5, 7);
  const yearOptions = [...new Set([defaultPeriod, values.period, ...periods].filter(isBudgetPeriod).map((period) => period.slice(0, 4)))].sort((a, b) => b.localeCompare(a)).map((year) => ({ value: year, label: year }));
  return <Modal isOpen onClose={onClose} title={budget ? 'Edit Budget' : 'Create Budget'} description={budget ? 'Update persisted budget configuration; usage is derived from the ledger.' : 'Set a persisted monthly spending limit for an expense category.'} maxWidth="md" footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button variant="accent" size="sm" onClick={save}>{budget ? 'Save Changes' : 'Create Budget'}</Button></>}>
    <form onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-4">
      <div><label htmlFor="budget-category" className="mb-1.5 block text-xs font-semibold text-primary">Category</label><Select id="budget-category" value={values.categoryId} disabled={Boolean(budget)} onChange={(event) => update('categoryId', event.target.value)} options={[{ value: '', label: 'Choose an expense category' }, ...categories.map((category) => ({ value: category.id, label: category.name }))]} className="h-10 w-full rounded-[12px] bg-card" aria-invalid={Boolean(errors.categoryId)} />{errors.categoryId && <p className="mt-1 text-xs text-danger">{errors.categoryId}</p>}{duplicateError && <p role="alert" className="mt-1 text-xs text-danger">{duplicateError}</p>}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor="budget-limit" className="mb-1.5 block text-xs font-semibold text-primary">Monthly Budget Limit</label><AmountInput id="budget-limit" min="0.01" value={values.monthlyLimit} onValueChange={(value) => update('monthlyLimit', value)} locale={locale} numberFormat={numberFormat} maximumFractionDigits={2} placeholder="0.00" error={errors.monthlyLimit} /></div><div><label htmlFor="budget-currency" className="mb-1.5 block text-xs font-semibold text-primary">Currency</label><Select id="budget-currency" value={values.currency} onChange={(event) => update('currency', event.target.value as WalletCurrencyCode)} options={supportedBudgetCurrencies.map((currency) => ({ value: currency, label: currency }))} className="h-10 w-full rounded-[12px] bg-card" aria-invalid={Boolean(errors.currency)} />{errors.currency && <p className="mt-1 text-xs text-danger">{errors.currency}</p>}</div></div>
      <div><span className="mb-1.5 block text-xs font-semibold text-primary">Period</span><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor="budget-month" className="sr-only">Month</label><Select id="budget-month" aria-label="Budget month" value={selectedMonth} onChange={(event) => update('period', `${selectedYear}-${event.target.value}` as BudgetPeriod)} options={monthOptions} className="h-10 w-full rounded-[12px] bg-card" aria-invalid={Boolean(errors.period)} /></div><div><label htmlFor="budget-year" className="sr-only">Year</label><Select id="budget-year" aria-label="Budget year" value={selectedYear} onChange={(event) => update('period', `${event.target.value}-${selectedMonth}` as BudgetPeriod)} options={yearOptions} className="h-10 w-full rounded-[12px] bg-card" aria-invalid={Boolean(errors.period)} /></div></div>{errors.period && <p className="mt-1 text-xs text-danger">{errors.period}</p>}</div>
      <div><label htmlFor="budget-notes" className="mb-1.5 block text-xs font-semibold text-primary">Notes <span className="font-normal text-secondary">(optional)</span></label><textarea id="budget-notes" rows={3} maxLength={500} value={values.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Add a note for this budget" className="w-full resize-y rounded-[12px] border border-border dark:border-[#32322A] bg-card dark:bg-[#1A1A17] px-3.5 py-2.5 text-sm text-primary dark:text-[#F2F2EE] placeholder:text-secondary/70 dark:placeholder:text-[#787870] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 dark:focus:ring-accent/25" /></div>
    </form>
  </Modal>;
}
