import type { Budget, BudgetCategoryOption, WalletCurrencyCode } from '../../types/finance';
import { BudgetCard } from './BudgetCard';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CategoryIcon } from '../categories/CategoryIcon';
import { money } from './budgetUtils';

export interface BudgetTemplate {
  categoryName: string;
  monthlyLimit: number;
  currency: WalletCurrencyCode;
  icon: string;
  description: string;
}

const starterBudgetTemplates: BudgetTemplate[] = [
  { categoryName: 'Food & Dining', monthlyLimit: 500, currency: 'USD', icon: 'cup-hot', description: 'Groceries, restaurants, and daily dining.' },
  { categoryName: 'Housing & Bills', monthlyLimit: 1200, currency: 'USD', icon: 'house-door', description: 'Rent, utilities, home internet, and upkeep.' },
  { categoryName: 'Shopping & Goods', monthlyLimit: 300, currency: 'USD', icon: 'bag', description: 'Clothing, personal gadgets, and goods.' },
  { categoryName: 'Transportation', monthlyLimit: 200, currency: 'USD', icon: 'fuel-pump', description: 'Public transit, fuel, rideshares, and tolls.' },
];

export interface BudgetGridProps {
  budgets: Budget[];
  categories?: BudgetCategoryOption[];
  currency?: WalletCurrencyCode;
  openMenuId: string | null;
  onToggleMenu: (id: string) => void;
  onView: (budget: Budget) => void;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  onCreate?: () => void;
  onUseTemplate?: (template: { categoryId: string; monthlyLimit: string; currency: WalletCurrencyCode }) => void;
}

export function BudgetGrid(props: BudgetGridProps) {
  if (props.budgets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface text-secondary">
            <Icon name="piggy-bank" className="text-xl" />
          </span>
          <h3 className="mt-3 text-base font-bold text-primary">No active budgets</h3>
          <p className="mt-1 max-w-md mx-auto text-xs text-secondary leading-relaxed">
            All user-created budgets are archived or deleted. Create a new custom budget or pick a starter template below to plan your category spending.
          </p>
          {props.onCreate && (
            <Button
              variant="accent"
              size="sm"
              leftIcon={<Icon name="plus-lg" />}
              onClick={props.onCreate}
              className="mt-4"
            >
              Create Budget
            </Button>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-primary">Starter budget suggestions</h3>
              <p className="text-xs text-secondary">
                Templates do not affect your spending or totals until activated.
              </p>
            </div>
            <span className="text-xs text-secondary font-medium">Suggestions only</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {starterBudgetTemplates.map((template) => {
              const matchedCat = props.categories?.find(
                (c) => c.name.toLowerCase() === template.categoryName.toLowerCase()
              );
              const templateCurrency = props.currency || template.currency || 'USD';
              return (
                <Card
                  key={template.categoryName}
                  padding="md"
                  className="flex flex-col justify-between border-dashed border-border bg-surface/50 gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-accent">
                        <CategoryIcon name={template.icon} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-primary">{template.categoryName}</h4>
                          <Badge variant="neutral">Template</Badge>
                        </div>
                        <p className="text-xs text-secondary mt-0.5">{template.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                    <div>
                      <span className="text-secondary block text-[10px] uppercase font-semibold">Suggested Limit</span>
                      <span className="font-bold text-primary text-sm">{money(template.monthlyLimit, templateCurrency)} / mo</span>
                    </div>
                    <div className="text-right">
                      <span className="text-secondary block text-[10px] uppercase font-semibold">Status</span>
                      <span className="text-secondary font-medium">{money(0, templateCurrency)} spent · Inactive</span>
                    </div>
                  </div>

                  {props.onUseTemplate && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      leftIcon={<Icon name="plus-lg" />}
                      onClick={() =>
                        props.onUseTemplate?.({
                          categoryId: matchedCat?.id ?? '',
                          monthlyLimit: String(template.monthlyLimit),
                          currency: templateCurrency,
                        })
                      }
                    >
                      Use Template
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Category budgets" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
      {props.budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          menuOpen={props.openMenuId === budget.id}
          onToggleMenu={() => props.onToggleMenu(budget.id)}
          onView={() => props.onView(budget)}
          onEdit={() => props.onEdit(budget)}
          onDelete={() => props.onDelete(budget)}
        />
      ))}
    </section>
  );
}
