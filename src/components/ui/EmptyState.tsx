import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center">
    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface text-secondary"><Icon name={icon} /></span>
    <p className="mt-3 text-sm font-semibold text-primary">{title}</p>
    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-secondary">{description}</p>
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>;
}
