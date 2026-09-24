import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function StableFilterRegion({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      {children}
    </div>
  );
}
