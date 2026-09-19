import type { CategoryRule, CategorySummaryData, FinanceCategory } from '../types/categories';

// Product-level mock aggregates. They intentionally do not derive from the seven
// preview transaction rows or from the smaller card subset rendered below.
export const categorySummary: CategorySummaryData = {
  totalCategories: 20,
  monthlyBudgetCap: 11600,
  autoRuleCoverage: 94.2,
  uncategorizedCount: 2,
  expenseCategoryCount: 14,
  incomeCategoryCount: 6,
};

export const expenseCategories: FinanceCategory[] = [
  { id: 'food-dining', name: 'Food & Dining', type: 'expense', icon: 'utensils', accent: 'orange', transactionCount: 46, monthlyAverage: 1450, budgetLimit: 2000, spent: 1450, keywords: ['UberEats', 'Whole Foods', 'Starbucks', 'DoorDash', 'Trader Joe\'s', 'Sweetgreen', 'Instacart'], status: 'active' },
  { id: 'housing-bills', name: 'Housing & Bills', type: 'expense', icon: 'home', accent: 'blue', transactionCount: 8, monthlyAverage: 3200, budgetLimit: 3500, spent: 3200, keywords: ['Chase Mortgage', 'ConEd', 'Spectrum'], status: 'active' },
  { id: 'travel-flights', name: 'Travel & Flights', type: 'expense', icon: 'plane', accent: 'purple', transactionCount: 5, monthlyAverage: 1250, budgetLimit: 2000, spent: 1250, keywords: ['Qatar Airways', 'Airbnb', 'Uber Global'], status: 'active' },
  { id: 'shopping-goods', name: 'Shopping & Goods', type: 'expense', icon: 'shopping-bag', accent: 'red', transactionCount: 19, monthlyAverage: 1750, budgetLimit: 1500, spent: 1750, keywords: ['Amazon', 'Apple Store', 'Target'], status: 'active' },
  { id: 'entertainment-tech', name: 'Entertainment & Tech', type: 'expense', icon: 'gamepad', accent: 'purple', transactionCount: 12, monthlyAverage: 480, budgetLimit: 600, spent: 480, keywords: ['Netflix', 'Steam', 'Spotify'], status: 'active' },
  { id: 'health-wellness', name: 'Health & Wellness', type: 'expense', icon: 'heart-pulse', accent: 'green', transactionCount: 4, monthlyAverage: 310, budgetLimit: 500, spent: 310, keywords: ['Equinox', 'CVS Caremark', 'One Medical'], status: 'active' },
  { id: 'education-growth', name: 'Education & Growth', type: 'expense', icon: 'graduation-cap', accent: 'yellow', transactionCount: 3, monthlyAverage: 630, budgetLimit: 1000, spent: 630, keywords: ['Coursera', 'MIT Press', 'Substack'], status: 'active' },
  { id: 'transport-fuel', name: 'Transport & Fuel', type: 'expense', icon: 'car', accent: 'blue', transactionCount: 15, monthlyAverage: 390, budgetLimit: 600, spent: 390, keywords: ['Shell Gas', 'Tesla Supercharge', 'MetroCard'], status: 'active' },
];

export const incomeCategories: FinanceCategory[] = [
  { id: 'salary', name: 'Salary', type: 'income', icon: 'briefcase', accent: 'green', transactionCount: 12, monthlyAverage: 8500, keywords: ['Tech Corp', 'Payroll', 'Direct deposit'], status: 'active' },
  { id: 'freelance-income', name: 'Freelance Income', type: 'income', icon: 'wallet', accent: 'blue', transactionCount: 7, monthlyAverage: 2400, keywords: ['Client', 'Contract', 'UI Design'], status: 'active' },
  { id: 'investment-income', name: 'Investment Income', type: 'income', icon: 'dollar-sign', accent: 'purple', transactionCount: 4, monthlyAverage: 860, keywords: ['Dividend', 'Brokerage', 'Interest'], status: 'active' },
  { id: 'bonus', name: 'Bonus', type: 'income', icon: 'gift', accent: 'yellow', transactionCount: 2, monthlyAverage: 1750, keywords: ['Annual bonus', 'Performance award'], status: 'active' },
  { id: 'refund', name: 'Refund', type: 'income', icon: 'wallet', accent: 'orange', transactionCount: 3, monthlyAverage: 220, keywords: ['Refund', 'Reimbursement', 'Credit'], status: 'active' },
  { id: 'other-income', name: 'Other Income', type: 'income', icon: 'dollar-sign', accent: 'red', transactionCount: 2, monthlyAverage: 340, keywords: ['Cashback', 'Gift', 'Other'], status: 'active' },
];

export const categoryRules: CategoryRule[] = [
  { id: 'rule-whole-foods', categoryId: 'food-dining', field: 'payee', operator: 'contains', value: 'Whole Foods', active: true, matchCount: 12, label: 'Grocery merchants' },
  { id: 'rule-starbucks', categoryId: 'food-dining', field: 'payee', operator: 'contains', value: 'Starbucks', active: true, matchCount: 8, label: 'Coffee merchants' },
  { id: 'rule-uber', categoryId: 'transport-fuel', field: 'payee', operator: 'contains', value: 'Uber', active: true, matchCount: 9, label: 'Ride-hailing merchants' },
  { id: 'rule-shell', categoryId: 'transport-fuel', field: 'payee', operator: 'contains', value: 'Shell', active: true, matchCount: 5, label: 'Fuel merchants' },
  { id: 'rule-netflix', categoryId: 'entertainment-tech', field: 'payee', operator: 'exact_match', value: 'Netflix', active: true, matchCount: 4, label: 'Streaming subscriptions' },
  { id: 'rule-payroll', categoryId: 'salary', field: 'description', operator: 'contains', value: 'Payroll', active: true, matchCount: 12, label: 'Payroll deposits' },
];

export const mockCategories: FinanceCategory[] = [...expenseCategories, ...incomeCategories];
