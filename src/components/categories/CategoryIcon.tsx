import { categoryIconMap } from './categoryUtils';
import type { CategoryIconName } from '../../types/categories';
import { Icon } from '../ui/Icon';

export function CategoryIcon({ name, className }: { name: CategoryIconName; className?: string }) {
  return <Icon name={categoryIconMap[name]} className={className} />;
}
