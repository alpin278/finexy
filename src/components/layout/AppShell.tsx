import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { MainContent } from './MainContent';
import { useAuth } from '../../context/useAuth';
import { getActiveTabFromPath, type NavigationTab } from '../../types/navigation';
import { Icon } from '../ui/Icon';
import { usePrivacy } from '../../context/usePrivacy';
import { CommandPalette, type PaletteCommand } from './CommandPalette';

import { useTheme } from '../../context/useTheme';

export interface AppShellProps {
  currentTab?: NavigationTab;
  onNavigate?: (tab: NavigationTab) => void;
  children?: React.ReactNode;
  className?: string;
}

export function AppShell({ currentTab, onNavigate, children, className }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { user, profile } = useAuth();
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const navigate = useNavigate();

  const profileName = profile?.display_name?.trim() || user?.email || 'Finexy user';
  const profileEmail = user?.email || profile?.email || '';

  const location = useLocation();
  const activeTab = currentTab || getActiveTabFromPath(location.pathname);
  const commands = useMemo<PaletteCommand[]>(() => [
    { id: 'overview', label: 'Overview', group: 'Navigate', icon: 'grid-1x2', route: '/overview' },
    { id: 'transactions', label: 'Transactions', group: 'Navigate', icon: 'arrow-left-right', route: '/transactions' },
    { id: 'wallets', label: 'Wallets', group: 'Navigate', icon: 'wallet2', route: '/wallets' },
    { id: 'budgets', label: 'Budgets', group: 'Navigate', icon: 'bullseye', route: '/budgets' },
    { id: 'reports', label: 'Reports', group: 'Navigate', icon: 'bar-chart', route: '/reports' },
    { id: 'categories', label: 'Categories', group: 'Navigate', icon: 'layers', route: '/categories' },
    { id: 'settings', label: 'Settings', group: 'Navigate', icon: 'gear', route: '/settings' },
    { id: 'profile', label: 'Profile', group: 'Navigate', icon: 'person', route: '/profile' },
    { id: 'new-transaction', label: 'New Transaction', group: 'Quick actions', icon: 'plus-lg', keywords: 'add record expense income', shortcut: 'N', route: '/transactions', action: 'new-transaction' },
    { id: 'transfer', label: 'Transfer', group: 'Quick actions', icon: 'arrow-left-right', shortcut: 'T', route: '/wallets', action: 'transfer' },
    { id: 'add-wallet', label: 'Add Wallet', group: 'Quick actions', icon: 'wallet2', route: '/wallets', action: 'add-wallet' },
    { id: 'create-budget', label: 'Create Budget', group: 'Quick actions', icon: 'bullseye', route: '/budgets', action: 'create-budget' },
    { id: 'add-recurring', label: 'Add Recurring Transaction', group: 'Quick actions', icon: 'arrow-repeat', route: '/transactions', action: 'add-recurring' },
    { id: 'export-transactions', label: 'Export Transactions', group: 'Quick actions', icon: 'download', route: '/transactions', action: 'export-transactions' },
    { id: 'data-backup', label: 'Open Data & Backup', group: 'Quick actions', icon: 'database', route: '/settings#data-backup' },
  ], []);

  const executeCommand = useCallback((command: PaletteCommand) => {
    navigate(command.route, command.action ? { state: { finexyAction: command.action, requestId: Date.now() } } : undefined);
  }, [navigate]);

  useEffect(() => {
    const isEditable = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="combobox"]'));
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setIsCommandPaletteOpen((open) => !open); return; }
      if (isEditable(event.target) || document.querySelector('[role="dialog"]')) return;
      if (event.shiftKey && event.key.toLowerCase() === 'p') { event.preventDefault(); togglePrivacyMode(); return; }
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.repeat) return;
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); executeCommand(commands.find((command) => command.id === 'new-transaction')!); }
      else if (event.key.toLowerCase() === 't') { event.preventDefault(); executeCommand(commands.find((command) => command.id === 'transfer')!); }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, [commands, executeCommand, togglePrivacyMode]);
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
    <div className={cn('min-h-screen bg-canvas p-0 sm:p-3 md:p-4 lg:p-6 flex items-center justify-center font-sans antialiased text-primary', privacyMode && 'privacy-mode')}>
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
          privacyMode={privacyMode}
          onTogglePrivacy={togglePrivacyMode}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Middle Body: Sidebar + Main Content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left narrow utility sidebar (Visible on tablet & desktop) */}
          <Sidebar
            currentTab={activeTab || undefined}
            onNavigate={onNavigate}
            isDarkTheme={theme === 'dark'}
            onToggleTheme={toggleTheme}
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
            <div className={cn('mobile-drawer-panel fixed inset-y-0 left-0 z-10 flex w-4/5 max-w-xs flex-col bg-card p-6 shadow-xl', isMobileMenuOpen && 'mobile-drawer-panel-open')}>
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
                          : 'border-transparent text-secondary hover:text-primary hover:bg-card hover:shadow-sm'
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
                          : 'border-transparent text-secondary hover:text-primary hover:bg-card hover:shadow-sm'
                        )}
                      >
                        <Icon name={tab.icon} className="text-base" />
                        <span>{tab.label}</span>
                      </Link>
                    );
                  })}
                  <div className="flex items-center justify-between px-4 py-2.5 mt-1 rounded-xl text-sm font-medium text-secondary">
                    <span className="flex items-center gap-3">
                      <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="text-base" />
                      <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        theme === 'dark' ? 'bg-accent' : 'bg-border'
                      )}
                    >
                      <span className={cn('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out', theme === 'dark' ? 'translate-x-5' : 'translate-x-0')} />
                    </button>
                  </div>
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
      {isCommandPaletteOpen && <CommandPalette open commands={commands} onClose={() => setIsCommandPaletteOpen(false)} onExecute={executeCommand} />}
    </div>
  );
}

export default AppShell;
