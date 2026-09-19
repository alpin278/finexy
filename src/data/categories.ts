import type { CategoryPresentationMetadata, DefaultCategoryRuleSeed, DefaultCategorySeed } from '../types/categories';

// These are the fourteen visible default records from the original Categories
// screen. Only these fields are persisted during a new-user bootstrap.
export const defaultCategorySeeds: DefaultCategorySeed[] = [
  { seedId: 'food-dining', name: 'Food & Dining', type: 'expense', icon: 'utensils', accent: 'orange', keywords: ['UberEats', 'Whole Foods', 'Starbucks', 'DoorDash', 'Trader Joe\'s', 'Sweetgreen', 'Instacart'], status: 'active' },
  { seedId: 'housing-bills', name: 'Housing & Bills', type: 'expense', icon: 'home', accent: 'blue', keywords: ['Chase Mortgage', 'ConEd', 'Spectrum'], status: 'active' },
  { seedId: 'travel-flights', name: 'Travel & Flights', type: 'expense', icon: 'plane', accent: 'purple', keywords: ['Qatar Airways', 'Airbnb', 'Uber Global'], status: 'active' },
  { seedId: 'shopping-goods', name: 'Shopping & Goods', type: 'expense', icon: 'shopping-bag', accent: 'red', keywords: ['Amazon', 'Apple Store', 'Target'], status: 'active' },
  { seedId: 'entertainment-tech', name: 'Entertainment & Tech', type: 'expense', icon: 'gamepad', accent: 'purple', keywords: ['Netflix', 'Steam', 'Spotify'], status: 'active' },
  { seedId: 'health-wellness', name: 'Health & Wellness', type: 'expense', icon: 'heart-pulse', accent: 'green', keywords: ['Equinox', 'CVS Caremark', 'One Medical'], status: 'active' },
  { seedId: 'education-growth', name: 'Education & Growth', type: 'expense', icon: 'graduation-cap', accent: 'yellow', keywords: ['Coursera', 'MIT Press', 'Substack'], status: 'active' },
  { seedId: 'transport-fuel', name: 'Transport & Fuel', type: 'expense', icon: 'car', accent: 'blue', keywords: ['Shell Gas', 'Tesla Supercharge', 'MetroCard'], status: 'active' },
  { seedId: 'salary', name: 'Salary', type: 'income', icon: 'briefcase', accent: 'green', keywords: ['Tech Corp', 'Payroll', 'Direct deposit'], status: 'active' },
  { seedId: 'freelance-income', name: 'Freelance Income', type: 'income', icon: 'wallet', accent: 'blue', keywords: ['Client', 'Contract', 'UI Design'], status: 'active' },
  { seedId: 'investment-income', name: 'Investment Income', type: 'income', icon: 'dollar-sign', accent: 'purple', keywords: ['Dividend', 'Brokerage', 'Interest'], status: 'active' },
  { seedId: 'bonus', name: 'Bonus', type: 'income', icon: 'gift', accent: 'yellow', keywords: ['Annual bonus', 'Performance award'], status: 'active' },
  { seedId: 'refund', name: 'Refund', type: 'income', icon: 'wallet', accent: 'orange', keywords: ['Refund', 'Reimbursement', 'Credit'], status: 'active' },
  { seedId: 'other-income', name: 'Other Income', type: 'income', icon: 'dollar-sign', accent: 'red', keywords: ['Cashback', 'Gift', 'Other'], status: 'active' },
];

// Presentation-only reference values from the original prototype. Transaction
// counts and monthly averages are not persisted until Transactions migrates.
export const categoryPresentationMetadata: Record<string, CategoryPresentationMetadata> = {
  'food-dining': { transactionCount: 46, monthlyAverage: 1450 },
  'housing-bills': { transactionCount: 8, monthlyAverage: 3200 },
  'travel-flights': { transactionCount: 5, monthlyAverage: 1250 },
  'shopping-goods': { transactionCount: 19, monthlyAverage: 1750 },
  'entertainment-tech': { transactionCount: 12, monthlyAverage: 480 },
  'health-wellness': { transactionCount: 4, monthlyAverage: 310 },
  'education-growth': { transactionCount: 3, monthlyAverage: 630 },
  'transport-fuel': { transactionCount: 15, monthlyAverage: 390 },
  salary: { transactionCount: 12, monthlyAverage: 8500 },
  'freelance-income': { transactionCount: 7, monthlyAverage: 2400 },
  'investment-income': { transactionCount: 4, monthlyAverage: 860 },
  bonus: { transactionCount: 2, monthlyAverage: 1750 },
  refund: { transactionCount: 3, monthlyAverage: 220 },
  'other-income': { transactionCount: 2, monthlyAverage: 340 },
};

// Rules are seed data only. matchCount remains presentation metadata because
// real transaction matching is intentionally outside this phase.
export const defaultCategoryRuleSeeds: DefaultCategoryRuleSeed[] = [
  { categorySeedId: 'food-dining', field: 'payee', operator: 'contains', value: 'Whole Foods', active: true, matchCount: 12, label: 'Grocery merchants' },
  { categorySeedId: 'food-dining', field: 'payee', operator: 'contains', value: 'Starbucks', active: true, matchCount: 8, label: 'Coffee merchants' },
  { categorySeedId: 'transport-fuel', field: 'payee', operator: 'contains', value: 'Uber', active: true, matchCount: 9, label: 'Ride-hailing merchants' },
  { categorySeedId: 'transport-fuel', field: 'payee', operator: 'contains', value: 'Shell', active: true, matchCount: 5, label: 'Fuel merchants' },
  { categorySeedId: 'entertainment-tech', field: 'payee', operator: 'exact_match', value: 'Netflix', active: true, matchCount: 4, label: 'Streaming subscriptions' },
  { categorySeedId: 'salary', field: 'description', operator: 'contains', value: 'Payroll', active: true, matchCount: 12, label: 'Payroll deposits' },
];
