import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import type { CategoryRule, FinanceCategory } from '../../types/categories';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { categoryIconMap, operatorLabels } from './categoryUtils';

export function RuleEngine({ rules, categories, onAdd, onToggle }: { rules: CategoryRule[]; categories: FinanceCategory[]; onAdd: () => void; onToggle: (rule: CategoryRule) => void }) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  return (
    <Card padding="md" className="min-w-0">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">Local automation</p><h2 className="mt-1 text-lg font-bold tracking-tight text-primary">Rule Engine</h2><p className="mt-1 text-xs leading-5 text-secondary">Simple merchant matches for this prototype.</p></div><Button variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={onAdd}>Add Rule</Button></div>
      <div className="mt-5 space-y-3">
        {rules.map((rule) => {
          const category = categoryById.get(rule.categoryId);
          const Icon = category ? categoryIconMap[category.icon] : null;
          return <div key={rule.id} className="rounded-2xl border border-border bg-surface p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-primary">{rule.label ?? 'Merchant match'}</p><p className="mt-1 text-[11px] leading-5 text-secondary">If {rule.field} {operatorLabels[rule.operator]} <span className="font-semibold text-primary">“{rule.value}”</span></p></div><button type="button" aria-label={`${rule.active ? 'Disable' : 'Enable'} rule for ${rule.value}`} aria-pressed={rule.active} onClick={() => onToggle(rule)} className="shrink-0 cursor-pointer rounded-lg text-secondary hover:text-primary">{rule.active ? <ToggleRight className="h-5 w-5 text-success" /> : <ToggleLeft className="h-5 w-5" />}</button></div><div className="mt-3 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-1.5 text-[11px] text-secondary">{Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}<span className="truncate">{category?.name ?? 'Unassigned category'}</span></div><div className="flex shrink-0 items-center gap-2">{rule.matchCount !== undefined && <span className="text-[10px] text-secondary">{rule.matchCount} matches</span>}<Badge variant={rule.active ? 'success' : 'neutral'}>{rule.active ? 'Enabled' : 'Disabled'}</Badge></div></div></div>;
        })}
        {!rules.length && <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-secondary">No matching rules yet.</p>}
      </div>
    </Card>
  );
}
