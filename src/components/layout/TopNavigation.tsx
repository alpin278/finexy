import { useState } from 'react';
import { Search, Bell, Info, ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { mockUser } from '../../data/mockUser';
import type { NavigationTab } from '../../types/navigation';

export interface TopNavigationProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenMobileMenu?: () => void;
  className?: string;
}

export function TopNavigation({
  currentTab,
  onNavigate,
  onOpenMobileMenu,
  className,
}: TopNavigationProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const navTabs: { id: NavigationTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'categories', label: 'Categories' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <header
      className={cn(
        'h-16 px-4 sm:px-6 lg:px-8 border-b border-[#ECECE8]/60 flex items-center justify-between gap-4 bg-transparent select-none shrink-0',
        className
      )}
    >
      {/* Left: Mobile hamburger + Finexy Logo */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-full text-[#777771] hover:text-[#171714] hover:bg-[#ECECE8]/60 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Finexy Logo */}
        <div
          onClick={() => onNavigate('overview')}
          className="flex items-center gap-2.5 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('overview')}
        >
          {/* Logo Mark: Orange Coral Circle with stylised F glyph */}
          <div className="w-8 h-8 rounded-full bg-[#FF5A36] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-150">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 4h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 0-1 1v4h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-[#171714] tracking-tight font-sans">Finexy</span>
        </div>
      </div>

      {/* Center: Navigation Pills (Desktop & Tablet) */}
      <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
        {navTabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-[#22221C] text-white shadow-xs'
                  : 'text-[#777771] hover:text-[#171714] hover:bg-[#ECECE8]/40'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Right: Search, Notifications, Info, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search input / button */}
        <div className="relative flex items-center">
          <div
            className={cn(
              'flex items-center transition-all duration-200',
              isSearchExpanded ? 'w-48 sm:w-56' : 'w-8 sm:w-44 lg:w-48'
            )}
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777771] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchExpanded(true)}
                onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                placeholder="Search..."
                className="w-full h-9 pl-9 pr-3 bg-[#FAFAF8] hover:bg-white border border-[#ECECE8] rounded-full text-xs text-[#171714] placeholder:text-[#777771] focus:outline-none focus:bg-white focus:border-[#171714] focus:ring-1 focus:ring-[#171714] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777771] hover:text-[#171714] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#777771] hover:text-[#171714] hover:bg-[#ECECE8]/60 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
        </button>

        {/* Info/Help alert */}
        <button
          type="button"
          aria-label="System Information"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#777771] hover:text-[#171714] hover:bg-[#ECECE8]/60 transition-colors cursor-pointer hidden sm:flex"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* User Profile Chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full border border-[#ECECE8] bg-[#FAFAF8] hover:bg-white transition-all cursor-pointer select-none"
          >
            <Avatar
              name={mockUser.name}
              src={mockUser.avatarUrl}
              size="sm"
              className="w-7 h-7"
            />
            <div className="text-left hidden xl:block leading-tight">
              <p className="text-xs font-semibold text-[#171714] truncate max-w-[110px]">
                {mockUser.name}
              </p>
              <p className="text-[10px] text-[#777771] truncate max-w-[110px]">
                sajibur.rahman@gm...
              </p>
            </div>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-[#777771] transition-transform duration-150',
                isProfileOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#ECECE8] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.08)] py-2 z-50 animate-in fade-in-80 duration-150"
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <div className="px-4 py-2.5 border-b border-[#ECECE8]/60">
                <p className="text-xs font-semibold text-[#171714]">{mockUser.name}</p>
                <p className="text-xs text-[#777771] truncate">{mockUser.email}</p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('settings');
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#171714] hover:bg-[#FAFAF8] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Profile Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('settings');
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#171714] hover:bg-[#FAFAF8] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Preferences</span>
                </button>
              </div>

              <div className="pt-1 border-t border-[#ECECE8]/60">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-xs text-[#E95E5E] hover:bg-[#E95E5E]/10 transition-colors cursor-pointer"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
