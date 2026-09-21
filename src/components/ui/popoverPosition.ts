import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';

export interface AnchoredPopoverPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'top' | 'bottom';
}

interface PositionOptions {
  contentHeight: number;
  minWidth?: number;
  preferredMaxHeight?: number;
}

const viewportGutter = 8;
const triggerGap = 6;

export function calculateAnchoredPopoverPosition(
  trigger: DOMRect,
  { contentHeight, minWidth = 160, preferredMaxHeight = 280 }: PositionOptions,
): AnchoredPopoverPosition {
  const availableBelow = Math.max(0, window.innerHeight - trigger.bottom - triggerGap - viewportGutter);
  const availableAbove = Math.max(0, trigger.top - triggerGap - viewportGutter);
  const desiredHeight = Math.min(contentHeight, preferredMaxHeight);
  const placement = availableBelow < Math.min(desiredHeight, 180) && availableAbove > availableBelow ? 'top' : 'bottom';
  const availableHeight = placement === 'bottom' ? availableBelow : availableAbove;
  const maxHeight = Math.max(48, Math.min(preferredMaxHeight, availableHeight));
  const width = Math.min(Math.max(trigger.width, minWidth), Math.max(0, window.innerWidth - viewportGutter * 2));
  const left = Math.min(Math.max(trigger.left, viewportGutter), Math.max(viewportGutter, window.innerWidth - width - viewportGutter));
  const top = placement === 'bottom'
    ? trigger.bottom + triggerGap
    : Math.max(viewportGutter, trigger.top - triggerGap - Math.min(desiredHeight, maxHeight));

  return { top, left, width, maxHeight, placement };
}

/**
 * Keeps body-ported floating content attached to its trigger. Scroll events are
 * coalesced to one animation frame, including scrollable modal content.
 */
export function useAnchoredPopoverPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  options: PositionOptions,
) {
  const [position, setPosition] = useState<AnchoredPopoverPosition | null>(null);
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const next = calculateAnchoredPopoverPosition(trigger.getBoundingClientRect(), options);
    setPosition((current) => current
      && current.top === next.top
      && current.left === next.left
      && current.width === next.width
      && current.maxHeight === next.maxHeight
      && current.placement === next.placement
      ? current
      : next);
  }, [options, triggerRef]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;
    let frame: number | null = null;
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        updatePosition();
      });
    };
    const observer = new ResizeObserver(scheduleUpdate);
    if (triggerRef.current) observer.observe(triggerRef.current);
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);
    window.visualViewport?.addEventListener('resize', scheduleUpdate);
    window.visualViewport?.addEventListener('scroll', scheduleUpdate);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
      window.visualViewport?.removeEventListener('resize', scheduleUpdate);
      window.visualViewport?.removeEventListener('scroll', scheduleUpdate);
    };
  }, [open, triggerRef, updatePosition]);

  return position;
}
