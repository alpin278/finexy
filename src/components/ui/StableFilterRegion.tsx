import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function StableFilterRegion({ children, className }: { children: ReactNode; className?: string }) {
  const regionRef = useRef<HTMLDivElement>(null);
  const [minimumHeight, setMinimumHeight] = useState(0);

  useLayoutEffect(() => {
    const nextHeight = Math.ceil(regionRef.current?.scrollHeight ?? 0);
    setMinimumHeight((currentHeight) => nextHeight > currentHeight ? nextHeight : currentHeight);
  }, [children]);

  return (
    <div
      ref={regionRef}
      className={cn('min-w-0', className)}
      style={minimumHeight ? { minHeight: `${minimumHeight}px` } : undefined}
    >
      {children}
    </div>
  );
}
