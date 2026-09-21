import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs({ tabs, activeTab, onChange, className, size = 'md' }: TabsProps) {
  return (
    <div
      className={cn(
        'isolate inline-flex max-w-full items-center gap-0.5 overflow-hidden rounded-full border border-border bg-surface p-1 shadow-sm',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-selected={isActive}
            className={cn(
              'relative inline-flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full border font-medium transition-[background-color,border-color,color,box-shadow] duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-xs sm:text-sm',
              isActive ? 'border-dark/10 bg-dark text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(23,23,20,0.12)]' : 'border-transparent text-secondary hover:bg-white hover:text-primary'
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={cn('px-1.5 py-0.2 rounded-full text-[10px] font-semibold', isActive ? 'bg-white/20 text-white' : 'bg-border text-secondary')}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
