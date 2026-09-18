import type { ComponentType } from 'react';
import {
  Sun,
  Moon,
  LayoutDashboard,
  ArrowLeftRight,
  Calendar,
  Layers,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';
import type { NavigationTab } from '../../types/navigation';

export interface SidebarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
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
  const mainNavItems: {
    id: string;
    label: string;
    tab?: NavigationTab;
    icon: ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Overview', tab: 'overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', tab: 'transactions', icon: ArrowLeftRight },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'categories', label: 'Categories', tab: 'categories', icon: Layers },
    { id: 'reports', label: 'Reports', tab: 'reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', tab: 'settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'w-14 sm:w-16 py-5 px-2 bg-transparent flex flex-col items-center justify-between shrink-0 border-r border-[#ECECE8]/60 select-none',
        className
      )}
      aria-label="Sidebar Navigation"
    >
      {/* Top: Theme toggle */}
      <div className="flex flex-col items-center gap-4">
        <Tooltip content={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'} position="right">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#777771] hover:text-[#171714] hover:bg-[#ECECE8]/60 transition-colors cursor-pointer"
          >
            {isDarkTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </Tooltip>

        <div className="w-6 h-[1px] bg-[#ECECE8]" />

        {/* Main Nav Items */}
        <nav className="flex flex-col items-center gap-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.tab ? currentTab === item.tab : false;

            return (
              <Tooltip key={item.id} content={item.label} position="right">
                <button
                  type="button"
                  onClick={() => {
                    if (item.tab) onNavigate(item.tab);
                  }}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer',
                    isActive
                      ? 'bg-[#22221C] text-white shadow-sm'
                      : 'text-[#777771] hover:text-[#171714] hover:bg-[#ECECE8]/60 active:scale-95'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </button>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Help & Logout */}
      <div className="flex flex-col items-center gap-2 pt-4 border-t border-[#ECECE8]/60 w-full">
        <Tooltip content="Help & Support" position="right">
          <button
            type="button"
            aria-label="Help & Support"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#777771] hover:text-[#171714] hover:bg-[#ECECE8]/60 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </Tooltip>

        <Tooltip content="Log out" position="right">
          <button
            type="button"
            aria-label="Log out"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#777771] hover:text-[#E95E5E] hover:bg-[#E95E5E]/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
