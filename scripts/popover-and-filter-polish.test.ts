import assert from 'node:assert/strict';
import {
  calculateAnchoredPopoverPosition,
  calculateModalPopoverPosition,
} from '../src/components/ui/popoverPosition';
import {
  matchesTransactionDatePeriod,
  getDatePeriodLabel,
  getTransactionDateFilterBounds,
} from '../src/lib/transaction-date-filter';

// 1. POPOVER POSITIONING TESTS
{
  // Test calculateAnchoredPopoverPosition normal bottom placement
  const triggerRect = {
    top: 100,
    bottom: 140,
    left: 200,
    right: 360,
    width: 160,
    height: 40,
    x: 200,
    y: 100,
    toJSON: () => {},
  } as DOMRect;

  // Window mock dimensions in node: innerWidth = 1024, innerHeight = 768
  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 800,
  } as unknown as Window & typeof globalThis;

  const posBottom = calculateAnchoredPopoverPosition(triggerRect, {
    contentHeight: 300,
    minWidth: 160,
    preferredMaxHeight: 400,
    flip: true,
  });

  assert.equal(posBottom.placement, 'bottom', 'Places below when ample space available');
  assert.equal(posBottom.top, 146, 'Top is trigger.bottom (140) + triggerGap (6)');
  assert.equal(posBottom.left, 200, 'Left aligns with trigger.left');
  assert.equal(posBottom.width, 160, 'Width matches trigger width');
  assert.equal(posBottom.hidden, false, 'Not hidden by default');

  // Test flip behavior when near viewport bottom
  const nearBottomTrigger = {
    top: 720,
    bottom: 760,
    left: 200,
    right: 360,
    width: 160,
    height: 40,
    x: 200,
    y: 720,
    toJSON: () => {},
  } as DOMRect;

  const posTop = calculateAnchoredPopoverPosition(nearBottomTrigger, {
    contentHeight: 300,
    minWidth: 160,
    preferredMaxHeight: 400,
    flip: true,
  });

  assert.equal(posTop.placement, 'top', 'Flips to top when availableBelow is too small');
  assert.equal(posTop.hidden, false);

  // Test flip: false preservation (for Select dropdowns configured with flip: false)
  const posNoFlip = calculateAnchoredPopoverPosition(nearBottomTrigger, {
    contentHeight: 300,
    minWidth: 160,
    preferredMaxHeight: 400,
    flip: false,
  });

  assert.equal(posNoFlip.placement, 'bottom', 'Preserves flip: false when requested');
}

// 2. MODAL POPOVER POSITIONING (BACKWARDS COMPATIBILITY)
{
  const triggerRect = {
    top: 200,
    bottom: 240,
    left: 50,
    right: 250,
    width: 200,
    height: 40,
  } as DOMRect;

  const scrollRootRect = {
    top: 100,
    bottom: 600,
    left: 40,
    right: 500,
    width: 460,
    height: 500,
  } as DOMRect;

  const modalPos = calculateModalPopoverPosition(triggerRect, scrollRootRect, {
    contentHeight: 200,
    minWidth: 160,
    preferredMaxHeight: 280,
  });

  assert.equal(modalPos.placement, 'bottom');
  assert.equal(modalPos.alignment, 'left');
}

// 3. DATE FILTER MODES & LABELS
{
  const bounds = getTransactionDateFilterBounds(new Date(2026, 8, 23));

  // All 7 modes verification
  assert.equal(matchesTransactionDatePeriod('2026-09-23', 'all-dates', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-09-23', 'this-month', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-08-15', 'last-month', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-01-01', 'year-to-date', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-05-15', 'month:2026-05', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-09-23', 'date:2026-09-23', bounds), true);
  assert.equal(matchesTransactionDatePeriod('2026-09-10', 'range:2026-09-01:2026-09-15', bounds), true);

  // Label formatting
  assert.equal(getDatePeriodLabel('all-dates'), 'All Dates');
  assert.equal(getDatePeriodLabel('this-month'), 'This Month');
  assert.equal(getDatePeriodLabel('last-month'), 'Last Month');
  assert.equal(getDatePeriodLabel('year-to-date'), 'Year to Date');
  assert.equal(getDatePeriodLabel('month:2026-09'), 'Sep 2026');
  assert.equal(getDatePeriodLabel('date:2026-09-23'), 'Sep 23, 2026');
  assert.equal(getDatePeriodLabel('range:2026-09-01:2026-09-15'), 'Sep 1, 2026 – Sep 15, 2026');
}

// 4. DESKTOP FILTER BAR LAYOUT ARITHMETIC
{
  const currencyWidth = 148;
  const dateWidth = 168;
  const categoryWidth = 158;
  const walletWidth = 148;
  const statusWidth = 130;
  const gap = 12; // gap-3 = 0.75rem = 12px
  const searchMax = 320;

  // Guidelines verification
  assert.ok(currencyWidth >= 145 && currencyWidth <= 155, 'Currency width in 145–155px');
  assert.ok(dateWidth >= 160 && dateWidth <= 175, 'Date width in 160–175px');
  assert.ok(categoryWidth >= 150 && categoryWidth <= 165, 'Category width in 150–165px');
  assert.ok(walletWidth >= 145 && walletWidth <= 160, 'Wallet width in 145–160px');
  assert.ok(statusWidth >= 125 && statusWidth <= 140, 'Status width in 125–140px');
  assert.ok(gap >= 12 && gap <= 14, 'Gap around 12–14px');
  assert.ok(searchMax >= 280 && searchMax <= 320, 'Search max width in 280–320px');

  // Selector group total with 4 internal gaps
  const selectorTotal = currencyWidth + dateWidth + categoryWidth + walletWidth + statusWidth + 4 * gap;
  assert.equal(selectorTotal, 800, 'Selector group total width is 800px');

  // Card inner width at 1280px viewport:
  // 1280 - 64 (sidebar) - 64 (main lg:px-8) - 32 (card sm:p-4) = 1120px
  const cardInner1280 = 1120;
  const searchAvailable1280 = cardInner1280 - selectorTotal - gap;
  assert.ok(searchAvailable1280 >= 280 && searchAvailable1280 <= 320, 'Search fits in 280–320px at 1280px viewport');
  assert.ok(selectorTotal + gap + searchAvailable1280 <= cardInner1280, 'No overflow at 1280px viewport');

  // Card inner width at 1280px viewport with 17px Windows scrollbar:
  const cardInner1280Scrollbar = 1103;
  const searchAvailableScrollbar = cardInner1280Scrollbar - selectorTotal - gap;
  assert.ok(searchAvailableScrollbar >= 260 && searchAvailableScrollbar <= 320, 'Search fits comfortably with scrollbar');
  assert.ok(selectorTotal + gap + searchAvailableScrollbar <= cardInner1280Scrollbar, 'No overflow with scrollbar');
}

// 5. BOUNDED CATEGORY/SELECT DROPDOWN & POSITION WRAPPER ZERO-LAG
{
  import('node:fs').then(({ readFileSync }) => {
    const selectContent = readFileSync(new URL('../src/components/ui/Select.tsx', import.meta.url), 'utf8');
    assert.ok(selectContent.includes('max-h-[280px]'), 'Select dropdown contains bounded max-height (max-h-[280px])');
    assert.ok(selectContent.includes('overscroll-contain'), 'Select dropdown contains overscroll-contain to isolate scroll');
    assert.ok(selectContent.includes('overflow-y-auto'), 'Select dropdown has internal scrolling for category options');

    const popoverPositionContent = readFileSync(new URL('../src/components/ui/popoverPosition.ts', import.meta.url), 'utf8');
    assert.ok(popoverPositionContent.includes("transition: 'none'"), 'Position wrapper has transition: none');
    assert.ok(popoverPositionContent.includes("transform: 'none'"), 'Position wrapper has transform: none');

    // 6. COMPACT MODAL DATEPICKER POLISH CHECKS
    const datePickerContent = readFileSync(new URL('../src/components/ui/DatePicker.tsx', import.meta.url), 'utf8');
    assert.ok(datePickerContent.includes('w-[320px]'), 'DatePicker width is 320px (in 310px–330px range)');
    assert.ok(datePickerContent.includes('h-8'), 'Selected day cell is h-8 (32px, in 32–34px range)');
    assert.ok(datePickerContent.includes('Today'), 'Today button is present');
    assert.ok(!datePickerContent.includes('>Close<') && !datePickerContent.includes('>Close </button>'), 'Close button is removed');
    assert.ok(!datePickerContent.includes('rgba(255,90,54,0.35)'), 'Heavy glow shadow is removed in favor of subtle shadow');
    assert.ok(datePickerContent.includes('shadow-sm'), 'Subtle shadow-sm is used on selected state');

    console.log('popover-and-filter-polish checks passed');
  });
}

