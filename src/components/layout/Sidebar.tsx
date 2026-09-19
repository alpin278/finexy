import type { ComponentType } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Calendar,
  Layers,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';
import { getActiveTabFromPath, type NavigationTab } from '../../types/navigation';
import { useAuth } from '../../context/useAuth';

export interface SidebarProps {
  currentTab?: NavigationTab;
  onNavigate?: (tab: NavigationTab) => void;
  className?: string;
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
}

export function Sidebar({
  currentTab,
  onNavigate,
  className,
  isDarkTheme = false,
  onToggleTheme,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const activeTab = currentTab || getActiveTabFromPath(location.pathname);

  const mainNavItems: {
    id: string;
    label: string;
    tab?: NavigationTab;
    path?: string;
    icon: ComponentType<{ className?: string }>;
  }[] = [
    { id: 'calendar', label: 'Calendar', path: '/overview', icon: Calendar },
    { id: 'categories', label: 'Categories', tab: 'categories', path: '/categories', icon: Layers },
    { id: 'settings', label: 'Settings', tab: 'settings', path: '/settings', icon: Settings },
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
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-border/60 transition-colors cursor-pointer"
          >
            {isDarkTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </Tooltip>

        <div className="w-6 h-[1px] bg-border" />

        {/* Main Nav Items */}
        <nav className="flex flex-col items-center gap-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
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
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150',
                      isActive
                        ? 'bg-dark text-white shadow-sm'
                        : 'text-secondary hover:text-primary hover:bg-border/60 active:scale-95'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                </Tooltip>
              );
            }

            return (
              <Tooltip key={item.id} content={item.label} position="right">
                <button
                  type="button"
                  aria-label={item.label}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-border/60 active:scale-95 transition-all cursor-pointer"
                >
                  <Icon className="w-5 h-5" />
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
            className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-border/60 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-5 h-5" />
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
            className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}

export default Sidebar;
