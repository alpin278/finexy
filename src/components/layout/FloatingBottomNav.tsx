import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/Icon';
import { getActiveTabFromPath, type NavigationTab } from '../../types/navigation';
import { prefetchRouteData } from '../../lib/route-prefetch';

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
  { id: 'categories', label: 'Categories', path: '/categories', icon: 'tags' },
  { id: 'reports', label: 'Reports', path: '/reports', icon: 'bar-chart-line' },
];

export function FloatingBottomNav({ currentTab, onNavigate, className }: FloatingBottomNavProps) {
  const location = useLocation();

  const [dockMode, setDockMode] = useState<{ pathname: string; isCompact: boolean }>({
    pathname: location.pathname,
    isCompact: false,
  });
  if (dockMode.pathname !== location.pathname) {
    setDockMode({ pathname: location.pathname, isCompact: false });
  }
  const isCompact = dockMode.pathname === location.pathname ? dockMode.isCompact : false;

  const accumulatedDownRef = useRef(0);
  const accumulatedUpRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const lastDirectionRef = useRef<'down' | 'up' | null>(null);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) return undefined;
    const downThreshold = 28;
    const upThreshold = 10;
    const topThreshold = 24;
    const main = document.querySelector<HTMLElement>('[data-popover-scroll-root]');
    let frame = 0;

    const setCompact = (compact: boolean) =>
      setDockMode((current) =>
        current.pathname === location.pathname && current.isCompact === compact
          ? current
          : { pathname: location.pathname, isCompact: compact }
      );

    const getScrollY = () => Math.max(main?.scrollTop ?? 0, window.scrollY || document.documentElement.scrollTop || 0);
    accumulatedDownRef.current = 0;
    accumulatedUpRef.current = 0;
    lastDirectionRef.current = null;
    lastScrollYRef.current = getScrollY();

    const update = () => {
      frame = 0;
      const currentScrollY = getScrollY();
      const delta = currentScrollY - lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      if (currentScrollY <= topThreshold) {
        setCompact(false);
        accumulatedDownRef.current = 0;
        accumulatedUpRef.current = 0;
        lastDirectionRef.current = null;
        return;
      }
      if (Math.abs(delta) < 1) return;

      if (delta > 0) {
        if (lastDirectionRef.current === 'up') accumulatedDownRef.current = 0;
        lastDirectionRef.current = 'down';
        accumulatedUpRef.current = 0;
        accumulatedDownRef.current += delta;
        if (accumulatedDownRef.current >= downThreshold) {
          setCompact(true);
          accumulatedDownRef.current = downThreshold;
        }
      } else {
        if (lastDirectionRef.current === 'down') accumulatedUpRef.current = 0;
        lastDirectionRef.current = 'up';
        accumulatedDownRef.current = 0;
        accumulatedUpRef.current += Math.abs(delta);
        if (accumulatedUpRef.current >= upThreshold) {
          setCompact(false);
          accumulatedUpRef.current = upThreshold;
        }
      }
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    main?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      main?.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, [location.pathname]);

  const activeTab = currentTab || getActiveTabFromPath(location.pathname);
  const activeIndex = navItems.findIndex(
    (item) => item.id === activeTab || location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
  );

  return (
    <nav
      aria-label="Primary mobile navigation"
      className={cn(
        'pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center bg-transparent px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:hidden',
        className
      )}
    >
      <div
        style={{
          width: 'calc(100vw - 24px)',
          maxWidth: isCompact ? '292px' : '340px',
          height: isCompact ? '46px' : '52px',
          padding: isCompact ? '3px' : '4px',
          flexShrink: 0,
        }}
        className={cn(
          'pointer-events-auto relative flex items-center rounded-full select-none',
          'transition-[max-width,width,height,padding] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          'bg-card/85 dark:bg-[#1A1A17]/85 backdrop-blur-xl backdrop-saturate-150',
          'border border-border/80 dark:border-white/10',
          'shadow-[0_8px_32px_-4px_rgba(23,23,20,0.12),0_2px_8px_rgba(23,23,20,0.06)]',
          'dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.3)]'
        )}
      >
        {/* Animated active indicator bubble gliding across six equal slots. */}
        {activeIndex >= 0 && (
          <div
            style={{ inset: isCompact ? '3px' : '4px' }}
            className="pointer-events-none absolute transition-[inset] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            aria-hidden="true"
          >
            <div
              data-active-indicator
              className="flex h-full w-1/6 items-center justify-center transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            >
              <div
                className={cn(
                  'rounded-full bg-dark shadow-[0_2px_8px_rgba(23,23,20,0.16)] dark:bg-white dark:shadow-[0_2px_10px_rgba(255,255,255,0.2)]',
                  'transition-[width,height] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                  isCompact ? 'h-[38px] w-[38px]' : 'h-[44px] w-[44px]'
                )}
              />
            </div>
          </div>
        )}

        {navItems.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => {
                onNavigate?.(item.id);
              }}
              onFocus={() => prefetchRouteData(item.path)}
              onPointerEnter={() => prefetchRouteData(item.path)}
              onPointerDown={() => prefetchRouteData(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative z-10 flex flex-1 items-center justify-center rounded-full transition-[height,color] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 motion-reduce:transition-none',
                isCompact ? 'h-[38px]' : 'h-[44px]',
                isActive
                  ? 'text-white dark:text-dark'
                  : 'text-secondary hover:text-primary dark:text-[#9C9C94] dark:hover:text-white'
              )}
            >
              <Icon
                name={item.icon}
                className={cn(
                  'transition-[font-size] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                  isCompact ? 'text-[16px]' : 'text-[18px]'
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default FloatingBottomNav;
