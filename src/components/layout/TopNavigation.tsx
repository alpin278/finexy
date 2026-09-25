import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { getActiveTabFromPath, type NavigationTab } from '../../types/navigation';
import { useAuth } from '../../context/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { formatNotificationTime, type InAppNotification } from '../../lib/notifications';
import { lockBodyScroll } from '../../lib/scroll-lock';

export interface TopNavigationProps {
  currentTab?: NavigationTab;
  onNavigate?: (tab: NavigationTab) => void;
  onOpenMobileMenu?: () => void;
  className?: string;
  privacyMode?: boolean;
  onTogglePrivacy?: () => void;
  onOpenCommandPalette?: () => void;
}

export function TopNavigation({
  currentTab,
  onNavigate,
  onOpenMobileMenu,
  className,
  privacyMode = false,
  onTogglePrivacy,
  onOpenCommandPalette,
}: TopNavigationProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const notificationsRef = useRef<HTMLDivElement>(null);
  const notificationsPanelRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const activeTab = currentTab || getActiveTabFromPath(location.pathname);
  const profileName = profile?.display_name?.trim() || user?.email || 'Finexy user';
  const profileEmail = user?.email || profile?.email || '';

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = async (notification: InAppNotification) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
    setIsNotificationsOpen(false);
    if (notification.type.startsWith('budget_')) {
      onNavigate?.('budgets');
      navigate('/budgets');
    }
  };

  useEffect(() => {
    if (!isNotificationsOpen && !isProfileOpen) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!notificationsRef.current?.contains(target)) setIsNotificationsOpen(false);
      if (!profileRef.current?.contains(target)) setIsProfileOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsNotificationsOpen(false);
      setIsProfileOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationsOpen, isProfileOpen]);

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;
    const unlock = lockBodyScroll();
    return unlock;
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (isNotificationsOpen) notificationsPanelRef.current?.focus();
  }, [isNotificationsOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const result = await signOut();
    setIsSigningOut(false);

    if (!result.error) {
      setIsProfileOpen(false);
      navigate('/login', { replace: true });
    }
  };

  const navTabs: { id: NavigationTab; label: string; path: string }[] = [
    { id: 'overview', label: 'Overview', path: '/overview' },
    { id: 'transactions', label: 'Transactions', path: '/transactions' },
    { id: 'wallets', label: 'Wallets', path: '/wallets' },
    { id: 'budgets', label: 'Budgets', path: '/budgets' },
    { id: 'reports', label: 'Reports', path: '/reports' },
  ];

  return (
    <header
      className={cn(
        'h-16 finexy-safe-top px-4 sm:px-6 lg:px-8 border-b border-border/60 flex items-center justify-between gap-2 sm:gap-3 lg:gap-2 bg-transparent select-none shrink-0',
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
            className="lg:hidden p-2 rounded-full text-secondary hover:text-primary hover:bg-border/60 cursor-pointer"
          >
            <Icon name="list" className="text-base" />
          </button>
        )}

        {/* Finexy Logo */}
        <Link
          to="/overview"
          onClick={() => onNavigate?.('overview')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          {/* Logo Mark: Orange Coral Circle with stylised F glyph */}
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-150">
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
          <span className="text-lg font-bold text-primary tracking-tight font-sans">Finexy</span>
        </Link>
      </div>

      {/* Center: Navigation Pills (Desktop & Tablet) */}
      <nav className="hidden items-center gap-1 overflow-hidden rounded-full p-0.5 md:flex lg:gap-1.5" aria-label="Main Navigation">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              onClick={() => onNavigate?.(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'px-3 xl:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
                isActive
                  ? 'border border-dark/10 bg-dark text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(23,23,20,0.12)]'
                  : 'border border-transparent text-secondary hover:border-border hover:bg-surface hover:text-primary hover:shadow-sm'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: Search, Notifications, Info, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-3">
        <button type="button" onClick={onOpenCommandPalette} aria-label="Open command palette" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-secondary transition-[background-color,border-color,color,transform] duration-150 hover:bg-card hover:text-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 sm:w-40 sm:justify-start sm:gap-2 sm:px-3 xl:w-48">
          <Icon name="search" className="text-sm" /><span className="hidden flex-1 text-left text-xs sm:block">Search commands</span><kbd className="hidden rounded border border-border bg-card px-1 text-[9px] font-semibold text-secondary xl:inline">⌘K</kbd>
        </button>

        {onTogglePrivacy && <button type="button" aria-label={`Privacy mode ${privacyMode ? 'on' : 'off'}`} aria-pressed={privacyMode} title="Privacy mode (Shift+P)" onClick={onTogglePrivacy} className={cn('flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25', privacyMode ? 'bg-dark text-white shadow-sm' : 'text-secondary hover:bg-surface hover:text-primary')}>
          <Icon name={privacyMode ? 'eye-slash' : 'eye'} className="text-sm" />
        </button>}

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            aria-expanded={isNotificationsOpen}
            aria-haspopup="dialog"
            onClick={() => { setIsNotificationsOpen((open) => !open); setIsProfileOpen(false); }}
            className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-secondary transition-[background-color,color,box-shadow,transform] duration-150 hover:bg-surface hover:text-primary hover:shadow-sm active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          >
            <Icon name="bell" className="text-sm" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white shadow-xs pointer-events-none"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <div
              ref={notificationsPanelRef}
              tabIndex={-1}
              role="dialog"
              aria-label="Notifications"
              className="menu-enter fixed inset-x-3 top-[4.5rem] z-50 flex max-h-[calc(100dvh-5.5rem)] flex-col overscroll-contain rounded-2xl border border-border bg-card shadow-dropdown focus:outline-none sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-h-[calc(100vh-8rem)]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-2.5 sm:py-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Notifications</p>
                  <p className="mt-0.5 text-[11px] text-secondary">Current alerts and updates</p>
                </div>
                {unreadCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      {unreadCount} unread
                    </span>
                    <button
                      type="button"
                      onClick={() => void markAllAsRead()}
                      className="text-[11px] font-medium text-secondary hover:text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 rounded cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>
                ) : (
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-secondary">
                    All clear
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 text-center sm:px-5 sm:py-7">
                  <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-surface text-secondary sm:h-10 sm:w-10">
                    <Icon name="bell-slash" />
                  </span>
                  <p className="mt-2.5 text-sm font-semibold text-primary">No new notifications</p>
                  <p className="mx-auto mt-1 max-w-[240px] text-xs leading-relaxed text-secondary">
                    Finexy has no unread or actionable in-app alerts for your account.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-border/50 max-h-[380px] overscroll-contain">
                  {notifications.map((notification) => {
                    const isUnread = !notification.readAt;
                    const isOverLimit = notification.type === 'budget_over_limit';
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void handleNotificationClick(notification)}
                        className={cn(
                          'w-full text-left p-3.5 sm:px-4 sm:py-3 flex items-start gap-3 transition-colors hover:bg-surface/80 focus-visible:outline-none focus-visible:bg-surface/80 cursor-pointer',
                          isUnread ? 'bg-accent/[0.04]' : 'opacity-80 hover:opacity-100'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm mt-0.5',
                            isOverLimit ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'
                          )}
                        >
                          <Icon name={isOverLimit ? 'exclamation-octagon' : 'exclamation-triangle'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className={cn('text-xs font-semibold truncate', isUnread ? 'text-primary' : 'text-secondary')}>
                              {notification.title}
                            </p>
                            <span className="text-[10px] text-secondary shrink-0">
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-secondary leading-snug line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {isUnread && (
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
                            title="Unread notification"
                            aria-label="Unread"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="shrink-0 border-t border-border/60 p-1.5 sm:p-2">
                <Link
                  to="/settings#notifications"
                  onClick={() => {
                    onNavigate?.('settings');
                    setIsNotificationsOpen(false);
                  }}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 sm:py-2.5"
                >
                  <span>Notification settings</span>
                  <Icon name="chevron-right" className="text-[10px] text-secondary" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Info/Help alert */}
        <button
          type="button"
          aria-label="System Information"
          className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-surface hover:shadow-sm transition-[background-color,color,box-shadow,transform] duration-150 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 hidden sm:flex"
        >
          <Icon name="info-circle" className="text-sm" />
        </button>

        {/* User Profile Chip */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => { setIsProfileOpen((open) => !open); setIsNotificationsOpen(false); }}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full border border-border bg-surface hover:bg-card transition-all cursor-pointer select-none"
          >
            <Avatar
              name={profileName}
              src={profile?.avatar_url ?? undefined}
              size="sm"
              className="w-7 h-7"
            />
            <div className="text-left hidden xl:block leading-tight">
              <p className="text-xs font-semibold text-primary truncate max-w-[110px]">
                {profileName}
              </p>
              <p className="text-[10px] text-secondary truncate max-w-[110px]">
                {profileEmail}
              </p>
            </div>
            <Icon name="chevron-down" className={cn('text-xs text-secondary transition-transform duration-150', isProfileOpen && 'rotate-180')} />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div
              className="menu-enter absolute right-0 z-50 mt-2 w-56 overscroll-contain rounded-2xl border border-border bg-card py-2 shadow-dropdown"
            >
              <div className="px-4 py-2.5 border-b border-border/60">
                <p className="text-xs font-semibold text-primary">{profileName}</p>
                <p className="text-xs text-secondary truncate">{profileEmail}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => {
                    onNavigate?.('profile');
                    setIsProfileOpen(false);
                  }}
                  className="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-xs text-primary transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
                >
                  <span>Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => {
                    onNavigate?.('settings');
                    setIsProfileOpen(false);
                  }}
                  className="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-xs text-primary transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
                >
                  <span>Settings</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                  className="w-full cursor-pointer px-4 py-2 text-left text-xs text-danger transition-colors hover:bg-danger/10 focus-visible:bg-danger/10 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
                >
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopNavigation;
