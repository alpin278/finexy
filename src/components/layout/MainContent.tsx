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
        'pt-6 sm:pt-8 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 min-w-0 flex-1 sm:overflow-x-hidden sm:overflow-y-auto sm:overscroll-contain px-4 sm:px-6 lg:px-8 max-w-[1520px] w-full mx-auto',
        className
      )}
    >
      {children}
    </main>
  );
}
