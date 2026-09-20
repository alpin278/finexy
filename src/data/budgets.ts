import type { WalletCurrencyCode } from '../types/finance';

// Deterministic configuration only. Limits are persisted during bootstrap;
// spend, averages, counts, and statuses are always derived from the ledger.
export const demoBudgetPeriod = '2026-04';

export interface DefaultBudgetSeed {
  categorySeedId: string;
  limitAmount: number;
  currency: WalletCurrencyCode;
  icon: string;
}

// The seeded transaction dataset is dated April 2026, so the first eight
// visible budgets use that period. New budgets default to the actual month.
export const defaultBudgetSeeds: DefaultBudgetSeed[] = [
  { categorySeedId: 'food-dining', limitAmount: 2000, currency: 'USD', icon: '🍽️' },
  { categorySeedId: 'housing-bills', limitAmount: 3500, currency: 'USD', icon: '🏠' },
  { categorySeedId: 'travel-flights', limitAmount: 2000, currency: 'USD', icon: '✈️' },
  { categorySeedId: 'shopping-goods', limitAmount: 1500, currency: 'USD', icon: '🛍️' },
  { categorySeedId: 'entertainment-tech', limitAmount: 600, currency: 'USD', icon: '🎧' },
  { categorySeedId: 'health-wellness', limitAmount: 500, currency: 'USD', icon: '💚' },
  { categorySeedId: 'education-growth', limitAmount: 1000, currency: 'USD', icon: '📚' },
  { categorySeedId: 'transport-fuel', limitAmount: 600, currency: 'USD', icon: '🚗' },
];
