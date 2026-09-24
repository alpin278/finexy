import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { FinexySplash } from './FinexySplash';

const MINIMUM_VISIBLE_MS = 280;
const EXIT_DURATION_MS = 260;
const STALL_TIMEOUT_MS = 6000;

/**
 * Orchestrates the application bootstrap splash lifecycle.
 * Appears ONLY during initial application load / hard refresh when auth session
 * is genuinely unresolved.
 *
 * Guarantees:
 * - Real readiness detection via AuthContext authReady
 * - Anti-flicker protection (restrained ~280ms threshold)
 * - Zero flash of unauthenticated or incorrect route states
 * - Graceful exit transition (~260ms) with destination already rendered underneath
 * - Permanent unmount once bootstrap completes (never triggers on route navigation, login, or logout)
 * - Purely presentation-layer stall watchdog: never fabricates auth resolution or redirects on timeout
 */
export function AppBootSplash() {
  const { authReady, retryAuth } = useAuth();
  const [mounted, setMounted] = useState(() => {
    // Disable if accessing the dedicated loading preview screen directly
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/loading-preview')) {
      return false;
    }
    return true;
  });
  const [isExiting, setIsExiting] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
  const mountTimeRef = useRef<number | null>(null);
  const hasTriggeredExitRef = useRef(false);

  useEffect(() => {
    if (mountTimeRef.current === null) {
      mountTimeRef.current = Date.now();
    }
  }, []);

  // Presentation-layer watchdog: alerts user if canonical startup takes longer than expected
  // without modifying auth truth, fabricating session state, or prematurely redirecting.
  useEffect(() => {
    if (!mounted || authReady) return;

    const stallTimer = window.setTimeout(() => {
      setIsStalled(true);
    }, STALL_TIMEOUT_MS);

    return () => window.clearTimeout(stallTimer);
  }, [authReady, mounted]);

  useEffect(() => {
    if (!mounted || hasTriggeredExitRef.current) return;

    if (authReady) {
      hasTriggeredExitRef.current = true;
      const startTime = mountTimeRef.current ?? Date.now();
      const elapsed = Date.now() - startTime;
      const remainingVisibleTime = Math.max(0, MINIMUM_VISIBLE_MS - elapsed);

      const exitTimer = window.setTimeout(() => {
        setIsExiting(true);

        const unmountTimer = window.setTimeout(() => {
          setMounted(false);
        }, EXIT_DURATION_MS);

        return () => window.clearTimeout(unmountTimer);
      }, remainingVisibleTime);

      return () => window.clearTimeout(exitTimer);
    }
  }, [authReady, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      aria-live="polite"
      aria-atomic="true"
    >
      <FinexySplash
        fullScreen
        isExiting={isExiting}
        className="h-full w-full"
      >
        {isStalled && !isExiting && (
          <div className="flex flex-col items-center gap-3 px-4 max-w-sm text-center">
            <p className="text-xs font-medium text-secondary">
              Finexy is taking longer than expected to start.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-splash-retry"
                onClick={() => {
                  setIsStalled(false);
                  mountTimeRef.current = Date.now();
                  void retryAuth();
                }}
                className="rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:bg-card hover:border-primary/20 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                Retry
              </button>
              <button
                type="button"
                id="btn-splash-reload"
                onClick={() => window.location.reload()}
                className="rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-secondary hover:text-primary hover:bg-card hover:border-primary/20 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                Reload
              </button>
            </div>
          </div>
        )}
      </FinexySplash>
    </div>
  );
}

export default AppBootSplash;
