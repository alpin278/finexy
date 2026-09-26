import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [isVisible, setIsVisible] = useState(true);
  const isInteractingRef = useRef(false);
  const interactionTimeoutRef = useRef<number | null>(null);

  const activeTab = currentTab || getActiveTabFromPath(location.pathname);
  const activeIndex = navItems.findIndex(
    (item) => item.id === activeTab || location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
  );

  // Immediately reveal bottom navigation on route navigation
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setIsVisible(true);
  }

  // Keep visible when user taps or focuses the navigation
  const handleInteraction = useCallback(() => {
    setIsVisible(true);
    isInteractingRef.current = true;
    if (interactionTimeoutRef.current !== null) {
      window.clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = window.setTimeout(() => {
      isInteractingRef.current = false;
    }, 800);
  }, []);

  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current !== null) {
        window.clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  // Directional scroll auto-hide
  useEffect(() => {
    const threshold = 10;
    const topThreshold = 24;
    let lastScrollY = 0;
    let ticking = false;

    const getScrollY = () => {
      const main = document.querySelector<HTMLElement>('[data-popover-scroll-root]');
      const mainScroll = main ? main.scrollTop : 0;
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      return Math.max(mainScroll, windowScroll);
    };

    lastScrollY = getScrollY();

    const updateScrollDirection = () => {
      const currentScrollY = getScrollY();
      const delta = currentScrollY - lastScrollY;

      if (isInteractingRef.current) {
        setIsVisible(true);
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      // Near top of page: always keep visible
      if (currentScrollY <= topThreshold) {
        setIsVisible(true);
        lastScrollY = currentScrollY;
      } else if (Math.abs(delta) >= threshold) {
        if (delta > 0) {
          // Meaningful scroll down -> smoothly hide
          setIsVisible(false);
        } else {
          // Meaningful scroll up -> smoothly return
          setIsVisible(true);
        }
        lastScrollY = currentScrollY;
      }

      ticking = false;
    };

    const mainEl = document.querySelector<HTMLElement>('[data-popover-scroll-root]');

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    mainEl?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });

    return () => {
      mainEl?.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, []);

  return (
    <nav
      aria-label="Primary mobile navigation"
      onFocusCapture={handleInteraction}
      onPointerDownCapture={handleInteraction}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] px-4',
        'transition-[transform,opacity] duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-none'
          : 'translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none',
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-auto relative flex items-center p-1.5 rounded-full select-none',
          'bg-card/85 dark:bg-[#1E1E1A]/85 backdrop-blur-xl backdrop-saturate-150',
          'border border-border/80 dark:border-white/10',
          'shadow-[0_8px_32px_-4px_rgba(23,23,20,0.12),0_2px_8px_rgba(23,23,20,0.06)]',
          'dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.3)]'
        )}
      >
        {/* Animated active indicator bubble (compact 40px) */}
        {activeIndex >= 0 && (
          <div
            data-active-indicator
            className="absolute top-1.5 left-1.5 w-10 h-10 rounded-full bg-dark dark:bg-white shadow-[0_2px_8px_rgba(23,23,20,0.16)] dark:shadow-[0_2px_10px_rgba(255,255,255,0.2)] transition-transform duration-200 ease-out pointer-events-none motion-reduce:transition-none"
            style={{
              transform: `translateX(${activeIndex * 40}px)`,
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
              onClick={() => {
                handleInteraction();
                onNavigate?.(item.id);
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                isActive
                  ? 'text-white dark:text-dark'
                  : 'text-secondary hover:text-primary dark:text-[#9C9C94] dark:hover:text-white'
              )}
            >
              <Icon name={item.icon} className="text-xl" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default FloatingBottomNav;
