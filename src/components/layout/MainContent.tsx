import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface MainContentProps {
  children: ReactNode;
  className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <main
      data-popover-scroll-root
      className={cn(
        'min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-[1520px] w-full mx-auto',
        className
      )}
    >
      {children}
    </main>
  );
}
