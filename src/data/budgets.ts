import type { Budget, BudgetStatus } from '../types/finance';

// These are product-level aggregates from the Categories Management design.
// They intentionally do not derive from the seven-row transaction preview.
// The $11,600 cap is a product-level reference summary and is intentionally
// independent from the visible category-limit subset (which totals $11,700).
export const monthlyBudgetCap = 11600;

export const budgetCategoryOptions = [
  { id: 'food-dining', name: 'Food & Dining', icon: '🍽️' },
  { id: 'housing-bills', name: 'Housing & Bills', icon: '🏠' },
  { id: 'travel-flights', name: 'Travel & Flights', icon: '✈️' },
  { id: 'shopping-goods', name: 'Shopping & Goods', icon: '🛍️' },
  { id: 'entertainment-tech', name: 'Entertainment & Tech', icon: '🎧' },
  { id: 'health-wellness', name: 'Health & Wellness', icon: '💚' },
  { id: 'education-growth', name: 'Education & Growth', icon: '📚' },
  { id: 'transport-fuel', name: 'Transport & Fuel', icon: '🚗' },
  { id: 'other', name: 'Other', icon: '◌' },
] as const;

const statusFor = (spent: number, limit: number): BudgetStatus => {
  const ratio = spent / limit;
  if (ratio >= 1) return 'over_budget';
  if (ratio >= 0.8) return 'near_limit';
  return 'on_track';
};

const createBudget = (budget: Omit<Budget, 'status'>): Budget => ({
  ...budget,
  status: statusFor(budget.spent, budget.monthlyLimit),
});

export const mockBudgets: Budget[] = [
  createBudget({ id: 'budget-food-dining', categoryId: 'food-dining', categoryName: 'Food & Dining', monthlyLimit: 2000, spent: 1450, monthlyAverage: 1450, transactionCount: 46, period: 'this-month', icon: '🍽️' }),
  createBudget({ id: 'budget-housing-bills', categoryId: 'housing-bills', categoryName: 'Housing & Bills', monthlyLimit: 3500, spent: 3200, monthlyAverage: 3200, transactionCount: 8, period: 'this-month', icon: '🏠' }),
  createBudget({ id: 'budget-travel-flights', categoryId: 'travel-flights', categoryName: 'Travel & Flights', monthlyLimit: 2000, spent: 1250, monthlyAverage: 1250, transactionCount: 5, period: 'this-month', icon: '✈️' }),
  createBudget({ id: 'budget-shopping-goods', categoryId: 'shopping-goods', categoryName: 'Shopping & Goods', monthlyLimit: 1500, spent: 1750, monthlyAverage: 1750, transactionCount: 19, period: 'this-month', icon: '🛍️' }),
  createBudget({ id: 'budget-entertainment-tech', categoryId: 'entertainment-tech', categoryName: 'Entertainment & Tech', monthlyLimit: 600, spent: 480, monthlyAverage: 480, transactionCount: 12, period: 'this-month', icon: '🎧' }),
  createBudget({ id: 'budget-health-wellness', categoryId: 'health-wellness', categoryName: 'Health & Wellness', monthlyLimit: 500, spent: 310, monthlyAverage: 310, transactionCount: 4, period: 'this-month', icon: '💚' }),
  createBudget({ id: 'budget-education-growth', categoryId: 'education-growth', categoryName: 'Education & Growth', monthlyLimit: 1000, spent: 630, monthlyAverage: 630, transactionCount: 3, period: 'this-month', icon: '📚' }),
  createBudget({ id: 'budget-transport-fuel', categoryId: 'transport-fuel', categoryName: 'Transport & Fuel', monthlyLimit: 600, spent: 390, monthlyAverage: 390, transactionCount: 15, period: 'this-month', icon: '🚗' }),
];

export const getBudgetStatus = statusFor;
