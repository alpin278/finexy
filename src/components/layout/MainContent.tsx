import React from 'react';
import { cn } from '../../lib/utils';

export interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1520px] w-full mx-auto',
        className
      )}
    >
      {children}
    </main>
  );
}
