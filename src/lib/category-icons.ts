import type { CategoryIconName } from '../types/categories';

export const fallbackCategoryIcon: CategoryIconName = 'wallet';

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

export function resolveCategoryIconName(value: string | null | undefined): CategoryIconName {
  return value && Object.prototype.hasOwnProperty.call(categoryIconMap, value)
    ? value as CategoryIconName
    : fallbackCategoryIcon;
}

export function resolveCategoryIcon(value: string | null | undefined) {
  return categoryIconMap[resolveCategoryIconName(value)];
}
