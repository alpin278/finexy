import type { CategoryType } from '../../types/categories';

export type CategoryTab = 'all' | CategoryType;

const tabs: { value: CategoryTab; label: string; countKey: 'total' | 'expense' | 'income' }[] = [
  { value: 'expense', label: 'Expense Categories', countKey: 'expense' },
  { value: 'income', label: 'Income Categories', countKey: 'income' },
  { value: 'all', label: 'All Categories', countKey: 'total' },
];

export function CategoryTabs({ active, onChange, counts }: { active: CategoryTab; onChange: (value: CategoryTab) => void; counts: { total: number; expense: number; income: number } }) {
  return (
    <div role="tablist" aria-label="Category type filters" className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={active === tab.value ? 'shrink-0 cursor-pointer rounded-full border border-dark/10 bg-dark px-3.5 py-2 text-xs font-semibold text-white shadow-sm ring-1 ring-dark/10 transition-[background-color,color,box-shadow,transform] duration-200 active:translate-y-px' : 'shrink-0 cursor-pointer rounded-full border border-transparent px-3.5 py-2 text-xs font-semibold text-secondary transition-[background-color,color,box-shadow,transform] duration-200 hover:bg-white hover:text-primary active:translate-y-px'}
        >
          {tab.label} <span className={active === tab.value ? 'ml-1 text-white/70' : 'ml-1 text-secondary/70'}>({counts[tab.countKey]})</span>
        </button>
      ))}
    </div>
  );
}
