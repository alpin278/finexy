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
        'inline-flex items-center gap-0.5 p-1 bg-surface border border-border rounded-full shadow-sm',
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
              'relative inline-flex items-center gap-1.5 rounded-full font-medium transition-[background-color,color,box-shadow,transform] duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-xs sm:text-sm',
              isActive ? 'text-white' : 'text-secondary hover:text-primary hover:bg-white'
            )}
          >
            {isActive && <span className="absolute inset-0 rounded-full border border-dark/10 bg-dark shadow-sm" aria-hidden="true" />}
            <span className="relative z-[1] inline-flex items-center gap-1.5">
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
