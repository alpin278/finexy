import { cn } from '../../lib/utils';

const Block = ({ className }: { className: string }) => <div aria-hidden="true" className={cn('skeleton rounded-xl', className)} />;

export function PageSkeleton({ variant = 'list' }: { variant?: 'dashboard' | 'list' | 'reports' }) {
  const cards = variant === 'reports' ? 4 : variant === 'dashboard' ? 6 : 5;
  return <div role="status" aria-label="Loading financial data" className="space-y-5">
    <span className="sr-only">Loading financial data…</span>
    <div className={cn('grid gap-4', variant === 'dashboard' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4')}>
      {Array.from({ length: cards }, (_, index) => <div key={index} className="rounded-[20px] border border-border bg-card p-5"><Block className="h-3 w-24" /><Block className="mt-5 h-7 w-36" /><Block className="mt-5 h-3 w-20" /></div>)}
    </div>
    <div className="rounded-[20px] border border-border bg-card p-5"><Block className="h-4 w-40" /><Block className={variant === 'list' ? 'mt-5 h-12 w-full' : 'mt-5 h-64 w-full'} />{variant === 'list' && <><Block className="mt-3 h-12 w-full" /><Block className="mt-3 h-12 w-full" /></>}</div>
  </div>;
}
