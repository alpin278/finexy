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
  monthlyBudgetCap: number | null;
  autoRuleCoverage: number | null;
  uncategorizedCount: number | null;
  expenseCategoryCount: number;
  incomeCategoryCount: number;
}

export interface DefaultCategorySeed {
  seedId: string;
  name: string;
  type: CategoryType;
  icon: CategoryIconName;
  accent: CategoryAccent;
  keywords: string[];
  status: CategoryStatus;
}

export interface CategoryPresentationMetadata {
  transactionCount: number;
  monthlyAverage: number;
}

export interface DefaultCategoryRuleSeed {
  categorySeedId: string;
  field: CategoryRuleField;
  operator: RuleOperator;
  value: string;
  label: string;
  active?: boolean;
  matchCount?: number;
}
