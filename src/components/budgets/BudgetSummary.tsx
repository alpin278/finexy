import { Card } from '../ui/Card';
import type { Budget } from '../../types/finance';
import { money } from './budgetUtils';

export function BudgetSummary({ budgets, monthlyCap }: { budgets: Budget[]; monthlyCap: number }) {
  const spent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const remaining = monthlyCap - spent;
  const overBudget = budgets.filter((budget) => budget.status === 'over_budget').length;
  const stats = [
    ['Monthly Budget', money(monthlyCap)],
    ['Spent This Month', money(spent)],
    ['Remaining', money(remaining)],
    ['Over Budget', `${overBudget} ${overBudget === 1 ? 'Category' : 'Categories'}`],
  ];
  return <section aria-label="Budget summary" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
    {stats.map(([label, value]) => <Card key={label} padding="sm" className="min-w-0">
      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] font-semibold text-secondary">{label}</p>
      <p className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-primary truncate">{value}</p>
    </Card>)}
  </section>;
}
