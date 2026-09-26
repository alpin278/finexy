import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { MainContent } from './MainContent';
import { FloatingBottomNav } from './FloatingBottomNav';
import { getActiveTabFromPath, type NavigationTab } from '../../types/navigation';
import { usePrivacy } from '../../context/usePrivacy';
import { CommandPalette, type PaletteCommand } from './CommandPalette';
import { useTheme } from '../../context/useTheme';
import { ConnectivityBanner } from './ConnectivityBanner';

export interface AppShellProps {
  currentTab?: NavigationTab;
  onNavigate?: (tab: NavigationTab) => void;
  children?: React.ReactNode;
  className?: string;
}

export function AppShell({ currentTab, onNavigate, children, className }: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const navigate = useNavigate();

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

  return (
    // Outer page container with canvas background and responsive framing
    <div className={cn('min-h-screen bg-surface sm:bg-canvas p-0 sm:p-3 md:p-4 lg:p-6 flex flex-col sm:items-center sm:justify-center font-sans antialiased text-primary', privacyMode && 'privacy-mode')}>
      {/* Centered Application Shell Container (Figma rounded app container) */}
      <div
        className={cn(
          'w-full max-w-[1600px] min-h-screen sm:min-h-0 sm:h-[calc(100vh-24px)] md:h-[calc(100vh-32px)] lg:h-[calc(100vh-48px)]',
          'bg-surface sm:rounded-[28px] border-0 sm:border sm:border-border',
          'sm:shadow-[0_12px_48px_-12px_rgba(23,23,20,0.08)] sm:overflow-hidden flex flex-col',
          className
        )}
      >
        {/* Top Navbar */}
        <TopNavigation
          currentTab={activeTab || undefined}
          onNavigate={onNavigate}
          privacyMode={privacyMode}
          onTogglePrivacy={togglePrivacyMode}
        />

        <ConnectivityBanner />

        {/* Middle Body: Sidebar + Main Content */}
        <div className="flex-1 flex flex-col sm:flex-row sm:overflow-hidden relative">
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
            <div key={location.pathname} className="route-enter sm:min-h-full">
              {children || <Outlet />}
            </div>
          </MainContent>
        </div>

        {/* Floating iOS-style Bottom Navigation for Mobile */}
        <FloatingBottomNav currentTab={activeTab || undefined} onNavigate={onNavigate} />
      </div>
      {isCommandPaletteOpen && <CommandPalette open commands={commands} onClose={() => setIsCommandPaletteOpen(false)} onExecute={executeCommand} />}
    </div>
  );
}

export default AppShell;
