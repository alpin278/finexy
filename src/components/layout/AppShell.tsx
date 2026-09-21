import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { MainContent } from './MainContent';
import { useAuth } from '../../context/useAuth';
import { getActiveTabFromPath, type NavigationTab } from '../../types/navigation';
import { Icon } from '../ui/Icon';

export interface AppShellProps {
  currentTab?: NavigationTab;
  onNavigate?: (tab: NavigationTab) => void;
  children?: React.ReactNode;
  className?: string;
}

export function AppShell({ currentTab, onNavigate, children, className }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const { user, profile } = useAuth();

  const profileName = profile?.display_name?.trim() || user?.email || 'Finexy user';
  const profileEmail = user?.email || profile?.email || '';

  const location = useLocation();
  const activeTab = currentTab || getActiveTabFromPath(location.pathname);
  const openMobileMenu = () => {
    setIsMobileMenuMounted(true);
    window.requestAnimationFrame(() => setIsMobileMenuOpen(true));
  };
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    window.setTimeout(() => setIsMobileMenuMounted(false), 180);
  };

  const primaryNavTabs: {
    id: NavigationTab;
    label: string;
    path: string;
    icon: string;
  }[] = [
    { id: 'overview', label: 'Overview', path: '/overview', icon: 'grid-1x2' },
    { id: 'transactions', label: 'Transactions', path: '/transactions', icon: 'arrow-left-right' },
    { id: 'wallets', label: 'Wallets', path: '/wallets', icon: 'wallet2' },
    { id: 'budgets', label: 'Budgets', path: '/budgets', icon: 'bullseye' },
    { id: 'reports', label: 'Reports', path: '/reports', icon: 'bar-chart' },
  ];

  const utilityNavTabs: {
    id: NavigationTab;
    label: string;
    path: string;
    icon: string;
  }[] = [
    { id: 'categories', label: 'Categories', path: '/categories', icon: 'layers' },
    { id: 'settings', label: 'Settings', path: '/settings', icon: 'gear' },
  ];

  return (
    // Outer page container with canvas background and responsive framing
    <div className="min-h-screen bg-canvas p-0 sm:p-3 md:p-4 lg:p-6 flex items-center justify-center font-sans antialiased text-primary">
      {/* Centered Application Shell Container (Figma rounded app container) */}
      <div
        className={cn(
          'w-full max-w-[1600px] h-screen sm:h-[calc(100vh-24px)] md:h-[calc(100vh-32px)] lg:h-[calc(100vh-48px)]',
          'bg-surface sm:rounded-[28px] border border-border',
          'shadow-[0_12px_48px_-12px_rgba(23,23,20,0.08)] overflow-hidden flex flex-col',
          className
        )}
      >
        {/* Top Navbar */}
        <TopNavigation
          currentTab={activeTab || undefined}
          onNavigate={onNavigate}
          onOpenMobileMenu={openMobileMenu}
        />

        {/* Middle Body: Sidebar + Main Content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left narrow utility sidebar (Visible on tablet & desktop) */}
          <Sidebar
            currentTab={activeTab || undefined}
            onNavigate={onNavigate}
            isDarkTheme={isDarkTheme}
            onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
            className="hidden sm:flex"
          />

          {/* Main content scrollable viewport */}
          <MainContent>
            <div key={location.pathname} className="route-enter min-h-full">
              {children || <Outlet />}
            </div>
          </MainContent>
        </div>

        {/* Mobile Slide-over Drawer for navigation */}
        {isMobileMenuMounted && (
          <div className="fixed inset-0 z-50 sm:hidden">
            {/* Backdrop */}
            <div
              className={cn('fixed inset-0 bg-primary/40', isMobileMenuOpen ? 'mobile-drawer-backdrop-open' : 'mobile-drawer-backdrop-close')}
              onClick={closeMobileMenu}
            />

            {/* Drawer Panel */}
            <div className={cn('mobile-drawer-panel fixed inset-y-0 left-0 z-10 flex w-4/5 max-w-xs flex-col bg-white p-6 shadow-xl', isMobileMenuOpen && 'mobile-drawer-panel-open')}>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm">
                    F
                  </div>
                  <span className="text-lg font-bold text-primary">Finexy</span>
                </div>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  aria-label="Close menu"
                  className="p-1.5 rounded-full text-secondary hover:text-primary hover:bg-border/60 cursor-pointer"
                >
                  <Icon name="x-lg" className="text-base" />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <div className="py-6 flex flex-col gap-1.5 flex-1">
                {primaryNavTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <Link
                      key={tab.id}
                      to={tab.path}
                      onClick={() => {
                        onNavigate?.(tab.id);
                        closeMobileMenu();
                      }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
                        isActive
                          ? 'border-dark/10 bg-dark text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(23,23,20,0.12)]'
                          : 'border-transparent text-secondary hover:text-primary hover:bg-white hover:shadow-sm'
                      )}
                    >
                      <Icon name={tab.icon} className="text-base" />
                      <span>{tab.label}</span>
                    </Link>
                  );
                })}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                    Utilities
                  </p>
                  {utilityNavTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <Link
                        key={tab.id}
                        to={tab.path}
                        onClick={() => {
                          onNavigate?.(tab.id);
                          closeMobileMenu();
                        }}
                        className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
                        isActive
                          ? 'border-dark/10 bg-dark text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(23,23,20,0.12)]'
                          : 'border-transparent text-secondary hover:text-primary hover:bg-white hover:shadow-sm'
                        )}
                      >
                        <Icon name={tab.icon} className="text-base" />
                        <span>{tab.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Drawer Footer */}
              <div className="pt-4 border-t border-border">
                <p className="truncate text-xs font-semibold text-primary">{profileName}</p>
                <p className="truncate text-xs text-secondary">{profileEmail}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppShell;
