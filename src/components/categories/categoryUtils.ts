import { getBudgetStatus } from '../../lib/budget-utils';
import type { BudgetStatus } from '../../types/finance';
import type { CategoryAccent, CategoryIconName, RuleOperator } from '../../types/categories';

export const money = (value: number, currency: 'USD' | 'EUR' | 'GBP' | 'IDR' = 'USD') => {
  if (currency === 'IDR') return `Rp${value.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`;
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const categoryIconMap: Record<CategoryIconName, string> = {
  utensils: 'fork-knife',
  home: 'house',
  plane: 'airplane',
  'shopping-bag': 'bag',
  gamepad: 'controller',
  'heart-pulse': 'heart-pulse',
  'graduation-cap': 'mortarboard',
  car: 'car-front',
  wallet: 'wallet2',
  briefcase: 'briefcase',
  'dollar-sign': 'currency-dollar',
  gift: 'gift',
};

export const accentOptions: { value: CategoryAccent; label: string; className: string }[] = [
  { value: 'orange', label: 'Orange', className: 'bg-accent' },
  { value: 'blue', label: 'Blue', className: 'bg-[#5E8EE9]' },
  { value: 'green', label: 'Green', className: 'bg-success' },
  { value: 'purple', label: 'Purple', className: 'bg-[#9C7BEA]' },
  { value: 'yellow', label: 'Yellow', className: 'bg-[#E8CF56]' },
  { value: 'red', label: 'Red', className: 'bg-danger' },
];

export const accentSurfaceClasses: Record<CategoryAccent, string> = {
  orange: 'bg-accent/10 text-accent border-accent/20',
  blue: 'bg-[#5E8EE9]/10 text-[#4779D0] border-[#5E8EE9]/20',
  green: 'bg-success/10 text-[#328864] border-success/20',
  purple: 'bg-[#9C7BEA]/10 text-[#7656C4] border-[#9C7BEA]/20',
  yellow: 'bg-[#E8CF56]/15 text-[#9E8314] border-[#E8CF56]/30',
  red: 'bg-danger/10 text-danger border-danger/20',
};

export const budgetStatusCopy: Record<BudgetStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  on_track: { label: 'On Track', variant: 'success' },
  near_limit: { label: 'Near Limit', variant: 'warning' },
  over_budget: { label: 'Over Budget', variant: 'danger' },
};

export const getCategoryBudgetStatus = (spent: number, limit: number): BudgetStatus => getBudgetStatus(spent, limit);

export const operatorLabels: Record<RuleOperator, string> = {
  contains: 'contains',
  starts_with: 'starts with',
  exact_match: 'exactly matches',
};

export const iconOptions: { value: CategoryIconName; label: string }[] = [
  { value: 'utensils', label: 'Utensils' },
  { value: 'home', label: 'Home' },
  { value: 'plane', label: 'Plane' },
  { value: 'shopping-bag', label: 'Shopping bag' },
  { value: 'gamepad', label: 'Gamepad' },
  { value: 'heart-pulse', label: 'Health' },
  { value: 'graduation-cap', label: 'Education' },
  { value: 'car', label: 'Car' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'dollar-sign', label: 'Dollar sign' },
  { value: 'gift', label: 'Gift' },
];
