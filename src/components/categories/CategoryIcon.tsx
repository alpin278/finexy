import { resolveCategoryIcon } from '../../lib/category-icons';
import { Icon } from '../ui/Icon';

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  return <Icon name={resolveCategoryIcon(name)} className={className} />;
}
