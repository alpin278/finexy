export type CategoryType = 'expense' | 'income';
export type CategoryStatus = 'active' | 'inactive';

export type CategoryIconName =
  | 'utensils'
  | 'home'
  | 'plane'
  | 'shopping-bag'
  | 'gamepad'
  | 'heart-pulse'
  | 'graduation-cap'
  | 'car'
  | 'wallet'
  | 'briefcase'
  | 'dollar-sign'
  | 'gift';

export type CategoryAccent = 'orange' | 'blue' | 'green' | 'purple' | 'yellow' | 'red';

export interface FinanceCategory {
  id: string;
  name: string;
  type: CategoryType;
  icon: CategoryIconName;
  accent: CategoryAccent;
  transactionCount: number;
  monthlyAverage: number;
  budgetLimit?: number;
  spent?: number;
  keywords: string[];
  status: CategoryStatus;
}

export type CategoryRuleField = 'payee' | 'description';
export type RuleOperator = 'contains' | 'starts_with' | 'exact_match';

export interface CategoryRule {
  id: string;
  categoryId: string;
  field: CategoryRuleField;
  operator: RuleOperator;
  value: string;
  active: boolean;
  matchCount?: number;
  label?: string;
}

export interface CategorySummaryData {
  totalCategories: number;
  monthlyBudgetCap: number;
  autoRuleCoverage: number;
  uncategorizedCount: number;
  expenseCategoryCount: number;
  incomeCategoryCount: number;
}
