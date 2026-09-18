import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { MainContent } from './MainContent';
import type { NavigationTab } from '../../types/navigation';
import { X, LayoutDashboard, ArrowLeftRight, Layers, BarChart3, Settings } from 'lucide-react';

export interface AppShellProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ currentTab, onNavigate, children, className }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const navTabs: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    // Outer page container with warm gray background and breathing room
    <div className="min-h-screen bg-[#F2F2F0] p-0 sm:p-3 md:p-4 lg:p-6 flex items-center justify-center font-sans antialiased text-[#171714]">
      {/* Centered Application Shell Container (Figma rounded app container) */}
      <div
        className={cn(
          'w-full max-w-[1600px] h-screen sm:h-[calc(100vh-24px)] md:h-[calc(100vh-32px)] lg:h-[calc(100vh-48px)]',
          'bg-[#FAFAF8] sm:rounded-[28px] border border-[#ECECE8]',
          'shadow-[0_12px_48px_-12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col',
          className
        )}
      >
        {/* Top Navbar */}
        <TopNavigation
          currentTab={currentTab}
          onNavigate={(tab) => {
            onNavigate(tab);
            setIsMobileMenuOpen(false);
          }}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Middle Body: Sidebar + Main Content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left narrow utility sidebar (Visible on tablet & desktop) */}
          <Sidebar
            currentTab={currentTab}
            onNavigate={onNavigate}
            isDarkTheme={isDarkTheme}
            onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
            className="hidden sm:flex"
          />

          {/* Main content scrollable viewport */}
          <MainContent>{children}</MainContent>
        </div>

        {/* Mobile Slide-over Drawer for navigation */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-[#171714]/40 backdrop-blur-xs transition-opacity duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer Panel */}
            <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-xl flex flex-col p-6 z-10 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#ECECE8]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FF5A36] flex items-center justify-center text-white font-bold text-sm">
                    F
                  </div>
                  <span className="text-lg font-bold text-[#171714]">Finexy</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-1.5 rounded-full text-[#777771] hover:text-[#171714] hover:bg-[#ECECE8]/60 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <div className="py-6 flex flex-col gap-1.5 flex-1">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        onNavigate(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer',
                        isActive
                          ? 'bg-[#22221C] text-white shadow-xs'
                          : 'text-[#777771] hover:text-[#171714] hover:bg-[#FAFAF8]'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Drawer Footer */}
              <div className="pt-4 border-t border-[#ECECE8]">
                <p className="text-xs font-semibold text-[#171714]">Sajibur Rahman</p>
                <p className="text-xs text-[#777771]">sajibur.rahman@gmail.com</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
