import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { useModalPopoverLayer } from './ModalContext';

export interface AnchoredPopoverPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'top' | 'bottom';
  alignment?: 'left' | 'right';
  hidden?: boolean;
  isNativeAnchor?: boolean;
  isLocal?: boolean;
  popoverHost?: HTMLElement | null;
  anchorName?: string;
  triggerStyle?: CSSProperties;
  popoverStyle?: CSSProperties;
}

export interface ModalPopoverPosition {
  placement: 'top' | 'bottom';
  alignment: 'left' | 'right';
  width: number;
  maxHeight: number;
}

export interface PositionOptions {
  contentHeight: number;
  minWidth?: number;
  preferredMaxHeight?: number;
  flip?: boolean;
  align?: 'left' | 'right' | 'auto';
  onClose?: () => void;
}

const viewportGutter = 8;
const triggerGap = 6;

/**
 * Feature detection for CSS Anchor Positioning Level 1.
 * Supported natively in Chrome 125+, Edge 125+, and modern Chromium engines.
 */
export const supportsNativeAnchor =
  typeof window !== 'undefined' &&
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('anchor-name', '--test') &&
  CSS.supports('position-anchor', '--test') &&
  CSS.supports('top', 'anchor(bottom)');

export function calculateAnchoredPopoverPosition(
  trigger: DOMRect,
  { contentHeight, minWidth = 160, preferredMaxHeight = 280, flip = true }: PositionOptions,
): AnchoredPopoverPosition {
  const availableBelow = Math.max(0, window.innerHeight - trigger.bottom - triggerGap - viewportGutter);
  const availableAbove = Math.max(0, trigger.top - triggerGap - viewportGutter);
  const desiredHeight = Math.min(contentHeight, preferredMaxHeight);
  const placement = flip && availableBelow < Math.min(desiredHeight, 180) && availableAbove > availableBelow ? 'top' : 'bottom';
  const availableHeight = placement === 'bottom' ? availableBelow : availableAbove;
  const maxHeight = flip ? Math.max(48, Math.min(preferredMaxHeight, availableHeight)) : Math.max(0, Math.min(preferredMaxHeight, availableBelow));
  const width = Math.min(Math.max(trigger.width, minWidth), Math.max(0, window.innerWidth - viewportGutter * 2));
  const left = Math.min(Math.max(trigger.left, viewportGutter), Math.max(viewportGutter, window.innerWidth - width - viewportGutter));
  const top = placement === 'bottom'
    ? trigger.bottom + triggerGap
    : Math.max(viewportGutter, trigger.top - triggerGap - Math.min(desiredHeight, maxHeight));

  return { top, left, width, maxHeight, placement, hidden: false };
}

export function calculateModalPopoverPosition(
  trigger: DOMRect,
  scrollRoot: DOMRect,
  options: PositionOptions,
): ModalPopoverPosition {
  const availableBelow = Math.max(0, scrollRoot.bottom - trigger.bottom - triggerGap);
  const availableAbove = Math.max(0, trigger.top - scrollRoot.top - triggerGap);
  const placement = options.flip !== false && availableBelow < Math.min(options.contentHeight, 180) && availableAbove > availableBelow ? 'top' : 'bottom';
  const availableHeight = placement === 'bottom' ? availableBelow : availableAbove;
  const maxHeight = Math.min(options.preferredMaxHeight ?? 280, availableHeight);
  const width = Math.max(trigger.width, options.minWidth ?? 160);
  return {
    placement,
    alignment: 'left',
    width,
    maxHeight,
  };
}

/**
 * Universal anchored popover hook.
 *
 * Architecture:
 * - Page controls:
 *   Render locally in the DOM flow with `position: absolute`.
 *   Move synchronously with the page scroll in the exact same compositor layer.
 *   Zero cross-layer lag, zero jumping, zero portal detached feeling.
 * - Modal controls:
 *   Portal into the modal's dedicated floating layer (`[data-modal-popover-layer]`)
 *   within the exact same modal shell and transform context.
 *   Uses native CSS anchor positioning or local absolute placement.
 * - Placement is locked on open to prevent sudden `flip-block` jumping during scroll.
 * - Out-of-view dismissal:
 *   Synchronous boundary check on the scroll container closes the popover cleanly
 *   the moment the trigger scrolls out of view.
 * - No geometric transitions (no scale, no translate, no transition-all).
 */
export function useAnchoredPopoverPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  options: PositionOptions,
  popoverRef?: RefObject<HTMLElement | null>,
  onClose?: () => void,
): AnchoredPopoverPosition {
  const hookId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const anchorName = useMemo(() => `--fa-${hookId}`, [hookId]);
  const activeOnClose = options.onClose ?? onClose;

  const modalLayer = useModalPopoverLayer();
  const popoverHost: HTMLElement | null = modalLayer;

  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const [alignment, setAlignment] = useState<'left' | 'right'>('left');
  const [fallbackCoords, setFallbackCoords] = useState<{
    top: number;
    left?: number;
    right?: number;
    width: number;
    ready: boolean;
  }>({ top: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - triggerGap - viewportGutter;
    const spaceAbove = rect.top - triggerGap - viewportGutter;
    const desiredHeight = Math.min(options.contentHeight, options.preferredMaxHeight ?? 280);
    const shouldFlip = options.flip !== false && spaceBelow < Math.min(desiredHeight, 180) && spaceAbove > spaceBelow;
    const nextPlacement = shouldFlip ? 'top' : 'bottom';
    setPlacement((prev) => (prev === nextPlacement ? prev : nextPlacement));

    const desiredWidth = options.minWidth ?? rect.width;
    const container = trigger.closest<HTMLElement>('[data-popover-scroll-root], [role="dialog"]') ?? (typeof document !== 'undefined' ? document.body : null);
    const containerRect = container ? container.getBoundingClientRect() : { left: 0, right: window.innerWidth };
    const wouldOverflowRight = rect.left + desiredWidth > containerRect.right - viewportGutter;
    const canAlignRight = rect.right - desiredWidth >= containerRect.left + viewportGutter;
    const shouldAlignRight = options.align === 'right' || (options.align !== 'left' && wouldOverflowRight && canAlignRight);
    const nextAlignment = shouldAlignRight ? 'right' : 'left';
    setAlignment((prev) => (prev === nextAlignment ? prev : nextAlignment));

    if (!supportsNativeAnchor && popoverHost) {
      const dialog = popoverHost.closest<HTMLElement>('[role="dialog"]') ?? trigger.closest<HTMLElement>('[role="dialog"]');
      if (dialog) {
        const dialogRect = dialog.getBoundingClientRect();
        const localTop = nextPlacement === 'bottom'
          ? rect.bottom - dialogRect.top + triggerGap
          : rect.top - dialogRect.top - triggerGap - desiredHeight;
        const localLeft = nextAlignment === 'left' ? rect.left - dialogRect.left : undefined;
        const localRight = nextAlignment === 'right' ? dialogRect.right - rect.right : undefined;
        setFallbackCoords({
          top: localTop,
          left: localLeft,
          right: localRight,
          width: desiredWidth,
          ready: true,
        });
      }
    }
  }, [open, options.align, options.contentHeight, options.flip, options.minWidth, options.preferredMaxHeight, popoverHost, triggerRef]);

  // Out-of-view auto-closing on scroll, throttled via requestAnimationFrame to eliminate scroll layout thrashing
  useEffect(() => {
    if (!open) return undefined;
    const trigger = triggerRef.current;
    if (!trigger) return undefined;

    const scrollContainer = trigger.closest<HTMLElement>('[data-popover-scroll-root], [data-scroll-root]');

    const checkBoundary = () => {
      if (!triggerRef.current) return;
      const tRect = triggerRef.current.getBoundingClientRect();
      const cRect = scrollContainer ? scrollContainer.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };

      // If trigger has scrolled completely out of visible scroll window:
      if (tRect.bottom <= cRect.top || tRect.top >= cRect.bottom) {
        if (popoverRef?.current) {
          popoverRef.current.style.display = 'none';
        }
        activeOnClose?.();
        return;
      }

      if (!supportsNativeAnchor && popoverHost) {
        const dialog = popoverHost.closest<HTMLElement>('[role="dialog"]') ?? triggerRef.current.closest<HTMLElement>('[role="dialog"]');
        if (dialog) {
          const dialogRect = dialog.getBoundingClientRect();
          const desiredHeight = Math.min(options.contentHeight, options.preferredMaxHeight ?? 280);
          const localTop = placement === 'bottom'
            ? tRect.bottom - dialogRect.top + triggerGap
            : tRect.top - dialogRect.top - triggerGap - desiredHeight;
          setFallbackCoords((prev) => ({
            ...prev,
            top: localTop,
          }));
        }
      }
    };

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        checkBoundary();
      });
    };

    const target = scrollContainer ?? window;
    target.addEventListener('scroll', handleScroll, { passive: true });
    if (scrollContainer) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      target.removeEventListener('scroll', handleScroll);
      if (scrollContainer) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [activeOnClose, open, options.contentHeight, options.preferredMaxHeight, placement, popoverHost, popoverRef, triggerRef]);

  // Styles: universal local DOM-flow absolute positioning matching History picker
  // Ensures 100% lockstep scroll synchronization in the exact same compositor layer
  const isLocal = !popoverHost;

  const triggerStyle: CSSProperties = useMemo(() => {
    if (isLocal || !supportsNativeAnchor) return {};
    return {
      ['anchorName' as string]: anchorName,
    };
  }, [anchorName, isLocal]);

  const popoverStyle: CSSProperties = useMemo(() => {
    const isHidden = !open;
    if (isHidden) {
      return { visibility: 'hidden', pointerEvents: 'none' };
    }

    // 1. Normal page controls: local absolute positioning inside the relative trigger container
    if (isLocal) {
      return {
        position: 'absolute',
        top: placement === 'bottom' ? 'calc(100% + 6px)' : undefined,
        bottom: placement === 'top' ? 'calc(100% + 6px)' : undefined,
        left: alignment === 'right' ? undefined : 0,
        right: alignment === 'right' ? 0 : undefined,
        zIndex: 50,
        width: options.minWidth ? 'max-content' : '100%',
        minWidth: options.minWidth ? `${options.minWidth}px` : '100%',
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: options.preferredMaxHeight ? `${options.preferredMaxHeight}px` : undefined,
        transition: 'none',
        transform: 'none',
        isolation: 'isolate',
      };
    }

    // 2. Modal controls: portaled into modal floating layer via native CSS anchor
    if (supportsNativeAnchor && popoverHost) {
      return {
        position: 'absolute',
        ['positionAnchor' as string]: anchorName,
        top: placement === 'bottom' ? 'anchor(bottom)' : undefined,
        bottom: placement === 'top' ? 'anchor(top)' : undefined,
        left: alignment === 'right' ? undefined : 'anchor(left)',
        right: alignment === 'right' ? 'anchor(right)' : undefined,
        marginTop: placement === 'bottom' ? '6px' : undefined,
        marginBottom: placement === 'top' ? '6px' : undefined,
        zIndex: 60,
        pointerEvents: 'auto',
        width: options.minWidth ? 'max-content' : 'anchor-size(width)',
        minWidth: options.minWidth ? `${options.minWidth}px` : 'anchor-size(width)',
        maxWidth: 'calc(100% - 1rem)',
        maxHeight: options.preferredMaxHeight ? `${options.preferredMaxHeight}px` : undefined,
        transition: 'none',
        transform: 'none',
      };
    }

    // 3. Fallback for non-anchor environments inside modal
    if (!fallbackCoords.ready) {
      return { visibility: 'hidden', pointerEvents: 'none' };
    }

    return {
      position: 'absolute',
      top: `${fallbackCoords.top}px`,
      left: fallbackCoords.left !== undefined ? `${fallbackCoords.left}px` : undefined,
      right: fallbackCoords.right !== undefined ? `${fallbackCoords.right}px` : undefined,
      zIndex: 60,
      width: options.minWidth ? 'max-content' : `${fallbackCoords.width}px`,
      minWidth: options.minWidth ? `${options.minWidth}px` : `${fallbackCoords.width}px`,
      maxWidth: 'calc(100% - 1rem)',
      maxHeight: options.preferredMaxHeight ? `${options.preferredMaxHeight}px` : undefined,
      transition: 'none',
      transform: 'none',
    };
  }, [alignment, anchorName, fallbackCoords, isLocal, open, options.minWidth, options.preferredMaxHeight, placement, popoverHost]);

  return useMemo(() => {
    return {
      top: 0,
      left: 0,
      width: 0,
      maxHeight: options.preferredMaxHeight ?? 280,
      placement,
      alignment,
      hidden: !open,
      isNativeAnchor: supportsNativeAnchor,
      isLocal,
      popoverHost: isLocal ? null : popoverHost,
      anchorName,
      triggerStyle,
      popoverStyle,
    };
  }, [alignment, anchorName, isLocal, open, options.preferredMaxHeight, placement, popoverHost, popoverStyle, triggerStyle]);
}

export default useAnchoredPopoverPosition;
