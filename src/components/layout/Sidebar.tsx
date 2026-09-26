import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';
import { Icon } from '../ui/Icon';
import { getActiveTabFromPath, type NavigationTab } from '../../types/navigation';
import { useAuth } from '../../context/useAuth';

import { useTheme } from '../../context/useTheme';

export interface SidebarProps {
  currentTab?: NavigationTab;
  onNavigate?: (tab: NavigationTab) => void;
  className?: string;
  isDarkTheme?: boolean;
  onToggleTheme?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Sidebar({
  currentTab,
  onNavigate,
  className,
  isDarkTheme: isDarkThemeProp,
  onToggleTheme,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const themeContext = useTheme();
  const isDarkTheme = isDarkThemeProp !== undefined ? isDarkThemeProp : themeContext.theme === 'dark';
  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onToggleTheme) {
      onToggleTheme(e);
    } else {
      themeContext.toggleTheme(e);
    }
  };
  const activeTab = currentTab || getActiveTabFromPath(location.pathname);

  const mainNavItems: {
    id: string;
    label: string;
    tab?: NavigationTab;
    path?: string;
    icon: string;
  }[] = [
    { id: 'settings', label: 'Settings', tab: 'settings', path: '/settings', icon: 'gear' },
  ];

  return (
    <aside
      className={cn(
        'w-14 sm:w-16 py-5 px-2 bg-transparent flex flex-col items-center justify-between shrink-0 border-r border-border/60 select-none',
        className
      )}
      aria-label="Sidebar Navigation"
    >
      {/* Top: Theme toggle & Main Navigation */}
      <div className="flex flex-col items-center gap-4">
        <Tooltip content={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'} position="right">
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
            className="group w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-surface hover:shadow-sm transition-[background-color,color,box-shadow,transform] duration-150 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          >
            <span
              className={cn(
                'inline-flex transition-transform duration-200 ease-out group-hover:scale-105',
                isDarkTheme ? 'rotate-[30deg] scale-100 text-warning' : 'rotate-0 scale-100 text-secondary'
              )}
            >
              <Icon name={isDarkTheme ? 'sun' : 'moon'} className="text-base" />
            </span>
          </button>
        </Tooltip>

        <div className="w-6 h-[1px] bg-border" />

        {/* Main Nav Items */}
        <nav className="flex flex-col items-center gap-2">
          {mainNavItems.map((item) => {
            const isActive = item.tab ? activeTab === item.tab : false;

            if (item.path) {
              return (
                <Tooltip key={item.id} content={item.label} position="right">
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (item.tab) onNavigate?.(item.tab);
                    }}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-[background-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
                      isActive
                        ? 'border border-dark/10 bg-dark text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(23,23,20,0.12)]'
                        : 'text-secondary hover:text-primary hover:bg-surface hover:shadow-sm active:scale-[0.97]'
                    )}
                  >
                    <Icon name={item.icon} className="text-base" />
                  </Link>
                </Tooltip>
              );
            }

            return (
              <Tooltip key={item.id} content={item.label} position="right">
                <button
                  type="button"
                  aria-label={item.label}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-surface active:scale-[0.97] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                >
                  <Icon name={item.icon} className="text-base" />
                </button>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Help & Logout */}
      <div className="flex flex-col items-center gap-2 pt-4 border-t border-border/60 w-full">
        <Tooltip content="Help & Support" position="right">
          <button
            type="button"
            aria-label="Help & Support"
            className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-surface hover:shadow-sm transition-[background-color,color,box-shadow,transform] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          >
            <Icon name="question-circle" className="text-base" />
          </button>
        </Tooltip>

        <Tooltip content="Log out" position="right">
          <button
            type="button"
            onClick={async () => {
              const result = await signOut();
              if (!result.error) {
                navigate('/login', { replace: true });
              }
            }}
            aria-label="Log out"
            className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25"
          >
            <Icon name="box-arrow-right" className="text-base" />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}

export default Sidebar;
