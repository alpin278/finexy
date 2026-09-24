import { useState } from 'react';
import type { CategoryRuleField, FinanceCategory, RuleOperator } from '../../types/categories';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';

export interface RuleFormValues {
  categoryId: string;
  field: CategoryRuleField;
  operator: RuleOperator;
  value: string;
}

export function RuleFormModal({ isOpen, categories, onClose, onSubmit }: { isOpen: boolean; categories: FinanceCategory[]; onClose: () => void; onSubmit: (values: RuleFormValues) => void }) {
  const [values, setValues] = useState<RuleFormValues>({ categoryId: categories[0]?.id ?? '', field: 'payee', operator: 'contains', value: '' });
  const [error, setError] = useState('');
  const update = <Key extends keyof RuleFormValues>(key: Key, value: RuleFormValues[Key]) => { setValues((current) => ({ ...current, [key]: value })); setError(''); };
  const save = () => { if (!values.categoryId) { setError('Choose a category.'); return; } if (!values.value.trim()) { setError('Enter a match value.'); return; } onSubmit({ ...values, value: values.value.trim() }); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Matching Rule" description="Create a persisted match for payees or descriptions." maxWidth="md" footer={<><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button variant="accent" size="sm" onClick={save}>Add Rule</Button></>}>
      <form onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-4">
        <div><label htmlFor="rule-category" className="mb-1.5 block text-xs font-semibold text-primary">Category</label><Select id="rule-category" value={values.categoryId} onChange={(event) => update('categoryId', event.target.value)} options={categories.map((category) => ({ value: category.id, label: `${category.name} · ${category.type}` }))} className="h-10 w-full rounded-[12px] bg-card px-3 pr-8" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor="rule-field" className="mb-1.5 block text-xs font-semibold text-primary">Field</label><Select id="rule-field" value={values.field} onChange={(event) => update('field', event.target.value as CategoryRuleField)} options={[{ value: 'payee', label: 'Payee' }, { value: 'description', label: 'Description' }]} className="h-10 w-full rounded-[12px] bg-card px-3 pr-8" /></div><div><label htmlFor="rule-operator" className="mb-1.5 block text-xs font-semibold text-primary">Operator</label><Select id="rule-operator" value={values.operator} onChange={(event) => update('operator', event.target.value as RuleOperator)} options={[{ value: 'contains', label: 'Contains' }, { value: 'starts_with', label: 'Starts with' }, { value: 'exact_match', label: 'Exact match' }]} className="h-10 w-full rounded-[12px] bg-card px-3 pr-8" /></div></div>
        <div><label htmlFor="rule-value" className="mb-1.5 block text-xs font-semibold text-primary">Match Value</label><Input id="rule-value" autoFocus value={values.value} onChange={(event) => update('value', event.target.value)} placeholder="e.g. Whole Foods" error={error} /></div>
        <p className="text-[11px] text-secondary">Rules persist to your account but do not recategorize transactions in this prototype.</p>
      </form>
    </Modal>
  );
}
