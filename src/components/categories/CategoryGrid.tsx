import type { FinanceCategory } from '../../types/categories';
import { CategoryCard } from './CategoryCard';

export function CategoryGrid({ categories, ruleCounts, openMenuId, onToggleMenu, onView, onEdit, onDelete }: { categories: FinanceCategory[]; ruleCounts: Record<string, number>; openMenuId: string | null; onToggleMenu: (id: string) => void; onView: (category: FinanceCategory) => void; onEdit: (category: FinanceCategory) => void; onDelete: (category: FinanceCategory) => void }) {
  if (!categories.length) {
    return <div className="rounded-[20px] border border-dashed border-border bg-white px-6 py-12 text-center"><p className="text-sm font-semibold text-primary">No categories match these filters.</p><p className="mt-1 text-xs text-secondary">Try a different search or reset one of the filter controls.</p></div>;
  }

  return (
    <section aria-label="Category cards" className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
      {categories.map((category) => <CategoryCard key={category.id} category={category} matchingRuleCount={ruleCounts[category.id] ?? 0} menuOpen={openMenuId === category.id} onToggleMenu={() => onToggleMenu(category.id)} onView={() => onView(category)} onEdit={() => onEdit(category)} onDelete={() => onDelete(category)} />)}
    </section>
  );
}
