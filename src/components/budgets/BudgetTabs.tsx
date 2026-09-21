import type { BudgetStatus } from '../../types/finance';

export type BudgetFilter = 'all' | BudgetStatus;
const tabs: { value: BudgetFilter; label: string }[] = [
  { value: 'all', label: 'All Budgets' },
  { value: 'on_track', label: 'On Track' },
  { value: 'near_limit', label: 'Near Limit' },
  { value: 'over_budget', label: 'Over Budget' },
];

export function BudgetTabs({ active, onChange, counts }: { active: BudgetFilter; onChange: (value: BudgetFilter) => void; counts: Record<BudgetFilter, number> }) {
  return (
    <div role="tablist" aria-label="Budget status filters" className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={isActive
              ? 'shrink-0 rounded-full border border-dark/10 bg-dark px-3.5 py-2 text-xs font-semibold text-white shadow-sm ring-1 ring-dark/10 transition-[background-color,color,box-shadow,transform] duration-200 cursor-pointer active:translate-y-px'
              : 'shrink-0 rounded-full border border-transparent px-3.5 py-2 text-xs font-semibold text-secondary transition-[background-color,color,box-shadow,transform] duration-200 hover:bg-white hover:text-primary cursor-pointer active:translate-y-px'}
          >
            {tab.label}
            <span className={isActive ? 'ml-1 text-white/70' : 'ml-1 text-secondary/70'}>{counts[tab.value]}</span>
          </button>
        );
      })}
    </div>
  );
}
