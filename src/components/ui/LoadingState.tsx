import { cn } from '../../lib/utils';

export function LoadingState({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
      </div>
      <div className="skeleton h-16 rounded-2xl" />
      <div className="skeleton h-72 rounded-2xl" />
    </div>
  );
}

