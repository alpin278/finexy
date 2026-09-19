import { categoryIconMap } from './categoryUtils';
import type { CategoryIconName } from '../../types/categories';

export function CategoryIcon({ name, className }: { name: CategoryIconName; className?: string }) {
  const Icon = categoryIconMap[name];
  return <Icon className={className} aria-hidden="true" />;
}
