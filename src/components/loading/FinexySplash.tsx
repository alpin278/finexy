import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface FinexySplashProps extends HTMLAttributes<HTMLDivElement> {
  /** If true, fills the full viewport. If false, fits its parent container. Defaults to true. */
  fullScreen?: boolean;
  /** Whether to render the primary FINEXY wordmark. Defaults to true. */
  showWordmark?: boolean;
  /** Optional manual override for reduced motion (e.g., for live preview toggling). */
  reducedMotion?: boolean;
  /** Optional custom width class for the ledger track (defaults to 'w-[130px] md:w-[150px]'). */
  trackWidthClass?: string;
  /** Whether the splash is actively performing its graceful exit transition. */
  isExiting?: boolean;
}

/**
 * Production Finexy Splash Screen component.
 * Faithfully reproduces the refined Google Stitch v1.1 splash prototype:
 * - Geometric uppercase FINEXY wordmark with optical letterspacing
 * - Precision financial ledger track with subtle center tick
 * - Travelling orange transaction point (#FF5A36) with illuminated trail
 * - Endpoint confirmation pulse ring
 * - Zero layout thrashing, pure CSS transform/opacity animations
 */
export function FinexySplash({
  fullScreen = true,
  showWordmark = true,
  reducedMotion = false,
  trackWidthClass = 'w-[130px] md:w-[150px]',
  isExiting = false,
  children,
  className,
  ...props
}: FinexySplashProps) {
  return (
    <div
      role="status"
      aria-label="Starting Finexy"
      className={cn(
        'relative flex flex-col items-center justify-center select-none overflow-hidden bg-canvas text-primary transition-colors duration-300',
        fullScreen ? 'fixed inset-0 z-50 min-h-screen w-screen' : 'h-full w-full min-h-[300px]',
        reducedMotion && 'finexy-splash-reduced',
        isExiting &&
          (reducedMotion
            ? 'opacity-0 pointer-events-none transition-none'
            : 'opacity-0 scale-[1.01] pointer-events-none transition-all duration-[260ms] ease-out'),
        className
      )}
      {...props}
    >
      {/* Subtle ambient gradient (very low contrast, preserves quiet negative space) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[400px] w-[400px] rounded-full bg-accent/10 opacity-20 blur-[140px] md:h-[500px] md:w-[500px]"
      />

      {/* Core Assembly */}
      <div className="relative z-10 flex flex-col items-center text-center finexy-splash-entrance">
        {/* FINEXY Wordmark */}
        {showWordmark && (
          <div className="mb-3 flex items-center">
            <span className="font-sans text-2xl font-extrabold uppercase tracking-[0.28em] text-primary transition-colors duration-300 pl-[0.28em] md:text-[28px]">
              FINEXY
            </span>
          </div>
        )}

        {/* Signature Ledger Line Component */}
        <div className="relative mt-1 flex items-center justify-center">
          {/* Base Ledger Track */}
          <div
            className={cn(
              'relative h-[1.5px] rounded-full bg-primary/15 transition-colors duration-300',
              trackWidthClass
            )}
          >
            {/* Active Recorded Trail */}
            <div
              aria-hidden="true"
              className={cn(
                'absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-transparent via-accent/35 to-accent',
                reducedMotion ? 'w-full opacity-60' : 'finexy-ledger-trail-active'
              )}
            />

            {/* Midway Entry Tick Mark */}
            <div
              aria-hidden="true"
              className={cn(
                'absolute left-1/2 top-1/2 h-[7px] w-[1.5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/35 transition-colors duration-300',
                reducedMotion ? 'opacity-50' : 'finexy-ledger-tick-active'
              )}
            />

            {/* Transaction Point (Finexy Orange Accent #FF5A36) */}
            <div
              aria-hidden="true"
              className={cn(
                'absolute top-1/2 z-10 h-[5.5px] w-[5.5px] -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_rgba(255,90,54,0.6)]',
                reducedMotion
                  ? 'right-0 translate-x-1/2 opacity-100'
                  : 'finexy-ledger-point-active'
              )}
            />

            {/* Confirmation Pulse Ring at Endpoint */}
            {!reducedMotion && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-accent finexy-ledger-pulse-active"
              />
            )}
          </div>
        </div>

        {/* Optional recovery / stall UI slot */}
        {children && (
          <div className="mt-8 transition-opacity duration-300">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export default FinexySplash;
