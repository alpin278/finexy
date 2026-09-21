import { useState } from 'react';
import type { CategoryAccent, CategoryIconName, CategoryStatus, CategoryType, FinanceCategory } from '../../types/categories';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { accentOptions, iconOptions } from './categoryUtils';
import { CategoryIcon } from './CategoryIcon';

export interface CategoryFormValues {
  name: string;
  type: CategoryType;
  icon: CategoryIconName;
  accent: CategoryAccent;
  keywords: string;
  status: CategoryStatus;
}

const getInitialValues = (category?: FinanceCategory | null): CategoryFormValues => ({
  name: category?.name ?? '',
  type: category?.type ?? 'expense',
  icon: category?.icon ?? 'wallet',
  accent: category?.accent ?? 'orange',
  keywords: category?.keywords.join(', ') ?? '',
  status: category?.status ?? 'active',
});

export function CategoryFormModal({ isOpen, category, categories, onClose, onSubmit }: { isOpen: boolean; category?: FinanceCategory | null; categories: FinanceCategory[]; onClose: () => void; onSubmit: (values: CategoryFormValues) => void }) {
  const [values, setValues] = useState<CategoryFormValues>(() => getInitialValues(category));
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormValues, string>>>({});

  const update = <Key extends keyof CategoryFormValues>(key: Key, value: CategoryFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const save = () => {
    const nextErrors: Partial<Record<keyof CategoryFormValues, string>> = {};
    const duplicate = categories.some((item) => item.id !== category?.id && item.type === values.type && item.name.trim().toLowerCase() === values.name.trim().toLowerCase());
    if (!values.name.trim()) nextErrors.name = 'Category name is required.';
    if (!values.type) nextErrors.type = 'Choose a category type.';
    if (duplicate) nextErrors.name = `A ${values.type} category with this name already exists.`;
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) onSubmit(values);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Edit Category' : 'Create New Category'} description={category ? 'Update this persisted category and its matching details.' : 'Add a persisted expense or income category.'} maxWidth="lg" footer={<><Button variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button><Button variant="accent" size="sm" onClick={save} type="button">{category ? 'Save Changes' : 'Create Category'}</Button></>}>
      <form onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-4">
        <div>
          <label htmlFor="category-name" className="mb-1.5 block text-xs font-semibold text-primary">Category Name</label>
          <Input id="category-name" autoFocus value={values.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Household Supplies" error={errors.name} />
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-primary">Type</legend>
          <div className="isolate grid grid-cols-2 gap-1 overflow-hidden rounded-[14px] border border-border bg-surface p-1">
            {(['expense', 'income'] as CategoryType[]).map((type) => <button key={type} type="button" aria-pressed={values.type === type} disabled={Boolean(category)} onClick={() => update('type', type)} className={values.type === type ? 'h-10 cursor-pointer rounded-[10px] border border-dark/10 bg-dark text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(23,23,20,0.12)] transition-[background-color,color,box-shadow] duration-200 disabled:cursor-not-allowed' : 'h-10 cursor-pointer rounded-[10px] border border-transparent bg-transparent text-sm font-medium text-secondary transition-[background-color,color,box-shadow] duration-200 hover:bg-white hover:text-primary disabled:cursor-not-allowed'}>{type === 'expense' ? 'Expense' : 'Income'}</button>)}
          </div>
          {category && <p className="mt-1.5 text-[11px] text-secondary">Type stays fixed during edits to protect budget semantics.</p>}
          {errors.type && <p className="mt-1 text-xs text-danger">{errors.type}</p>}
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category-icon" className="mb-1.5 block text-xs font-semibold text-primary">Icon</label>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface"><CategoryIcon name={values.icon} className="h-4 w-4 text-primary" /></div>
              <Select id="category-icon" value={values.icon} onChange={(event) => update('icon', event.target.value as CategoryIconName)} options={iconOptions} className="h-10 w-full rounded-[12px] bg-white px-3 pr-8" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-primary">Accent</label>
            <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-3">
              {accentOptions.map((accent) => <button key={accent.value} type="button" aria-label={`${accent.label} accent`} aria-pressed={values.accent === accent.value} onClick={() => update('accent', accent.value)} className={`h-5 w-5 cursor-pointer rounded-full ${accent.className} ${values.accent === accent.value ? 'ring-2 ring-primary ring-offset-2' : 'opacity-60 hover:opacity-100'}`} />)}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="category-keywords" className="mb-1.5 block text-xs font-semibold text-primary">Keywords / Merchant Matches <span className="font-normal text-secondary">(optional)</span></label>
          <Input id="category-keywords" value={values.keywords} onChange={(event) => update('keywords', event.target.value)} placeholder="Whole Foods, Starbucks, grocery" />
          <p className="mt-1 text-[11px] text-secondary">Separate payee or description matches with commas.</p>
        </div>

        <div>
          <label htmlFor="category-status" className="mb-1.5 block text-xs font-semibold text-primary">Status</label>
          <Select id="category-status" value={values.status} onChange={(event) => update('status', event.target.value as CategoryStatus)} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} className="h-10 w-full rounded-[12px] bg-white px-3 pr-8" />
        </div>
      </form>
    </Modal>
  );
}
