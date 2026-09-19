import type { CategoryType } from '../../types/categories';

export type CategoryTab = 'all' | CategoryType;

const tabs: { value: CategoryTab; label: string; countKey: 'total' | 'expense' | 'income' }[] = [
  { value: 'expense', label: 'Expense Categories', countKey: 'expense' },
  { value: 'income', label: 'Income Categories', countKey: 'income' },
  { value: 'all', label: 'All Categories', countKey: 'total' },
];

export function CategoryTabs({ active, onChange, counts }: { active: CategoryTab; onChange: (value: CategoryTab) => void; counts: { total: number; expense: number; income: number } }) {
  return (
    <div role="tablist" aria-label="Category type filters" className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={active === tab.value ? 'shrink-0 cursor-pointer rounded-full bg-dark px-3.5 py-2 text-xs font-semibold text-white' : 'shrink-0 cursor-pointer rounded-full border border-border bg-white px-3.5 py-2 text-xs font-semibold text-secondary hover:bg-surface hover:text-primary'}
        >
          {tab.label} <span className={active === tab.value ? 'ml-1 text-white/70' : 'ml-1 text-secondary/70'}>({counts[tab.countKey]})</span>
        </button>
      ))}
    </div>
  );
}
