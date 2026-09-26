import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/Icon';
import { getActiveTabFromPath, type NavigationTab } from '../../types/navigation';

export interface FloatingBottomNavProps {
  currentTab?: NavigationTab;
  onNavigate?: (tab: NavigationTab) => void;
  className?: string;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  path: string;
  icon: string;
}

const navItems: readonly NavItem[] = [
  { id: 'overview', label: 'Overview', path: '/overview', icon: 'house-door' },
  { id: 'transactions', label: 'Transactions', path: '/transactions', icon: 'arrow-left-right' },
  { id: 'wallets', label: 'Wallets', path: '/wallets', icon: 'wallet2' },
  { id: 'budgets', label: 'Budgets', path: '/budgets', icon: 'pie-chart' },
  { id: 'reports', label: 'Reports', path: '/reports', icon: 'bar-chart-line' },
];

export function FloatingBottomNav({ currentTab, onNavigate, className }: FloatingBottomNavProps) {
  const location = useLocation();
  const activeTab = currentTab || getActiveTabFromPath(location.pathname);
  const activeIndex = navItems.findIndex(
    (item) => item.id === activeTab || location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
  );

  return (
    <nav
      aria-label="Primary mobile navigation"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] px-4',
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-auto relative flex items-center p-1.5 rounded-full',
          'bg-card/85 dark:bg-[#1E1E1A]/85 backdrop-blur-xl backdrop-saturate-150',
          'border border-border/80 dark:border-white/10',
          'shadow-[0_8px_32px_-4px_rgba(23,23,20,0.12),0_2px_8px_rgba(23,23,20,0.06)]',
          'dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.3)]'
        )}
      >
        {/* Animated active indicator bubble */}
        {activeIndex >= 0 && (
          <div
            className="absolute top-1.5 left-1.5 w-12 h-12 rounded-full bg-dark dark:bg-white shadow-[0_2px_8px_rgba(23,23,20,0.16)] dark:shadow-[0_2px_10px_rgba(255,255,255,0.2)] transition-transform duration-200 ease-out pointer-events-none motion-reduce:transition-none"
            style={{
              transform: `translateX(${activeIndex * 48}px)`,
            }}
            aria-hidden="true"
          />
        )}

        {navItems.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => onNavigate?.(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative z-10 flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                isActive
                  ? 'text-white dark:text-dark'
                  : 'text-secondary hover:text-primary dark:text-[#9C9C94] dark:hover:text-white'
              )}
            >
              <Icon name={item.icon} className="text-lg" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default FloatingBottomNav;
