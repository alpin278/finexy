import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';

export interface CategoryFilterValues {
  search: string;
  type: 'all' | 'expense' | 'income';
  budget: 'all' | 'has_budget' | 'no_budget';
  rules: 'all' | 'enabled' | 'disabled';
}

export function CategoryFilters({ values, onChange }: { values: CategoryFilterValues; onChange: (next: Partial<CategoryFilterValues>) => void }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="min-w-0 flex-1 sm:min-w-[220px]">
        <Input aria-label="Search categories and keywords" value={values.search} onChange={(event) => onChange({ search: event.target.value })} placeholder="Search categories & keywords..." leftIcon={<Icon name="search" />} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Filter by category type" value={values.type} onChange={(event) => onChange({ type: event.target.value as CategoryFilterValues['type'] })} options={[{ value: 'all', label: 'All Types' }, { value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} icon={<Icon name="funnel" />} />
        <Select aria-label="Filter by budget status" value={values.budget} onChange={(event) => onChange({ budget: event.target.value as CategoryFilterValues['budget'] })} options={[{ value: 'all', label: 'Budget: All' }, { value: 'has_budget', label: 'Has Active Budget' }, { value: 'no_budget', label: 'No Budget' }]} />
        <Select aria-label="Filter by rule status" value={values.rules} onChange={(event) => onChange({ rules: event.target.value as CategoryFilterValues['rules'] })} options={[{ value: 'all', label: 'Rules: All' }, { value: 'enabled', label: 'Auto-Rule Enabled' }, { value: 'disabled', label: 'No Active Rule' }]} />
      </div>
    </div>
  );
}
