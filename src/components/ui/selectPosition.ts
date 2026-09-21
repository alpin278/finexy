export interface SelectTriggerRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
}

export interface SelectPopoverPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'top' | 'bottom';
}

const viewportGutter = 8;
const triggerGap = 6;
const preferredMaxHeight = 280;
const minimumWidth = 160;
const optionHeight = 37;
const menuChromeHeight = 14;

export function estimateSelectMenuHeight(optionCount: number) {
  return Math.max(menuChromeHeight, optionCount * optionHeight + menuChromeHeight);
}

export function calculateSelectPopoverPosition(
  trigger: SelectTriggerRect,
  viewportWidth: number,
  viewportHeight: number,
  contentHeight: number,
): SelectPopoverPosition {
  const availableBelow = Math.max(0, viewportHeight - trigger.bottom - triggerGap - viewportGutter);
  const availableAbove = Math.max(0, trigger.top - triggerGap - viewportGutter);
  const desiredHeight = Math.min(contentHeight, preferredMaxHeight);
  const placement = availableBelow < Math.min(desiredHeight, 180) && availableAbove > availableBelow ? 'top' : 'bottom';
  const availableHeight = placement === 'bottom' ? availableBelow : availableAbove;
  const maxHeight = Math.max(48, Math.min(preferredMaxHeight, availableHeight));
  const width = Math.min(Math.max(trigger.width, minimumWidth), Math.max(0, viewportWidth - viewportGutter * 2));
  const left = Math.min(Math.max(trigger.left, viewportGutter), Math.max(viewportGutter, viewportWidth - width - viewportGutter));
  const top = placement === 'bottom'
    ? trigger.bottom + triggerGap
    : Math.max(viewportGutter, trigger.top - triggerGap - Math.min(desiredHeight, maxHeight));

  return { top, left, width, maxHeight, placement };
}

export function moveSelectIndex(currentIndex: number, optionCount: number, direction: 1 | -1) {
  if (optionCount <= 0) return -1;
  if (currentIndex < 0) return direction === 1 ? 0 : optionCount - 1;
  return (currentIndex + direction + optionCount) % optionCount;
}
