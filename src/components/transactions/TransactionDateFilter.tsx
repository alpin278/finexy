import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../ui/Icon';
import { cn } from '../../lib/utils';
import { useAnchoredPopoverPosition } from '../ui/popoverPosition';
import {
  getDatePeriodLabel,
  getTransactionDateFilterBounds,
  type TransactionDateFilterBounds,
} from '../../lib/transaction-date-filter';

export interface TransactionDateFilterProps {
  value: string;
  onChange: (period: string) => void;
  className?: string;
  'aria-label'?: string;
}

type CustomSubMode = 'month' | 'date' | 'range';

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseYmd(val: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function TransactionDateFilter({
  value,
  onChange,
  className,
  'aria-label': ariaLabel = 'Date filter',
}: TransactionDateFilterProps) {
  const generatedId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  // Derive initial sub-mode from current value
  const initialSubMode = useMemo<CustomSubMode>(() => {
    if (value.startsWith('date:')) return 'date';
    if (value.startsWith('range:')) return 'range';
    return 'month';
  }, [value]);

  const [subMode, setSubMode] = useState<CustomSubMode>(initialSubMode);

  // Month navigation year
  const initialYear = useMemo(() => {
    if (value.startsWith('month:')) {
      const y = Number(value.slice(6, 10));
      if (!Number.isNaN(y)) return y;
    }
    return new Date().getFullYear();
  }, [value]);
  const [monthYear, setMonthYear] = useState<number>(initialYear);

  // Calendar display month for date and range pickers
  const initialDisplayMonth = useMemo(() => {
    if (value.startsWith('date:')) {
      const parsed = parseYmd(value.slice(5));
      if (parsed) return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
    if (value.startsWith('range:')) {
      const from = value.slice(6).split(':')[0];
      const parsed = parseYmd(from);
      if (parsed) return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [value]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(initialDisplayMonth);

  // Range picker click state: first click sets rangeStart, second click finishes
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    setRangeStart(null);
    setHoverDate(null);
  }, []);

  const positioning = useMemo(() => ({ contentHeight: 440, minWidth: 320, preferredMaxHeight: 520, flip: false, onClose: handleClose }), [handleClose]);
  const position = useAnchoredPopoverPosition(open, triggerRef, positioning, popoverRef, handleClose);

  const bounds: TransactionDateFilterBounds = useMemo(() => getTransactionDateFilterBounds(), []);

  // When opening, synchronize sub-mode and view
  const handleOpen = () => {
    if (value.startsWith('date:')) {
      setSubMode('date');
      const parsed = parseYmd(value.slice(5));
      if (parsed) setCalendarMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    } else if (value.startsWith('range:')) {
      setSubMode('range');
      const from = value.slice(6).split(':')[0];
      const parsed = parseYmd(from);
      if (parsed) setCalendarMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    } else if (value.startsWith('month:')) {
      setSubMode('month');
      const y = Number(value.slice(6, 10));
      if (!Number.isNaN(y)) setMonthYear(y);
    } else {
      setSubMode('month');
      setMonthYear(new Date().getFullYear());
    }
    setRangeStart(null);
    setHoverDate(null);
    setOpen(true);
  };

  // Click outside and escape key handling
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        handleClose();
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        handleClose();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [handleClose, open]);

  // Instant action handlers
  const choosePreset = (preset: string) => {
    onChange(preset);
    handleClose();
    triggerRef.current?.focus();
  };

  const chooseMonth = (monthIndex: number) => {
    const formatted = `${monthYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange(`month:${formatted}`);
    handleClose();
    triggerRef.current?.focus();
  };

  const chooseDate = (date: Date) => {
    const ymd = toYmd(date);
    onChange(`date:${ymd}`);
    handleClose();
    triggerRef.current?.focus();
  };

  const handleRangeDateClick = (date: Date) => {
    const ymd = toYmd(date);
    if (!rangeStart) {
      setRangeStart(ymd);
    } else {
      let from = rangeStart;
      let to = ymd;
      if (from > to) {
        const tmp = from;
        from = to;
        to = tmp;
      }
      onChange(`range:${from}:${to}`);
      handleClose();
      triggerRef.current?.focus();
    }
  };

  const displayLabel = getDatePeriodLabel(value);
  const isFiltered = value !== 'all-dates';

  // Calendar calculations
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const gridStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - monthStart.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    return new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
  });

  const calendarMonthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarMonth);

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        id={`date-filter-${generatedId}`}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={position?.triggerStyle}
        onClick={() => (open ? handleClose() : handleOpen())}
        className={cn(
          'relative flex h-10 min-w-0 cursor-pointer items-center justify-between gap-1.5 rounded-[12px] border bg-card pl-3.5 pr-8 text-left text-xs font-semibold shadow-[0_1px_2px_rgba(23,23,20,0.04)]',
          'transition-[border-color,box-shadow,background-color] duration-150 hover:border-border-hover focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15',
          isFiltered
            ? 'border-accent/40 bg-accent/[0.03] text-primary'
            : 'border-border text-primary',
          className,
        )}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 truncate mr-1">
          <Icon name="calendar3" className={cn('text-xs shrink-0', isFiltered ? 'text-accent' : 'text-secondary')} />
          <span className="truncate">{displayLabel}</span>
        </span>
        <Icon
          name="chevron-down"
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-secondary transition-transform duration-150',
            open && 'rotate-180 text-accent',
          )}
        />
      </button>

      {open && (() => {
        const popoverNode = (
          <div
            style={position?.popoverStyle}
            className="pointer-events-none"
          >
            <div
              ref={popoverRef}
              role="dialog"
              aria-label="Filter transactions by date"
              onWheel={(e) => e.stopPropagation()}
              className="pointer-events-auto w-[320px] sm:w-[340px] rounded-[16px] border border-border bg-card p-3.5 shadow-dropdown transition-opacity duration-100 ease-out"
            >
              {/* Quick Presets */}
              <div className="grid grid-cols-2 gap-1.5 pb-2.5 border-b border-border/70">
              <button
                type="button"
                onClick={() => choosePreset('all-dates')}
                className={cn(
                  'h-8 px-2.5 rounded-[9px] text-xs font-medium transition-colors text-left flex items-center justify-between cursor-pointer',
                  value === 'all-dates'
                    ? 'bg-accent/10 text-accent font-semibold border border-accent/25'
                    : 'text-primary hover:bg-surface border border-transparent',
                )}
              >
                <span>All Dates</span>
                {value === 'all-dates' && <Icon name="check" className="text-accent text-xs" />}
              </button>
              <button
                type="button"
                onClick={() => choosePreset('this-month')}
                className={cn(
                  'h-8 px-2.5 rounded-[9px] text-xs font-medium transition-colors text-left flex items-center justify-between cursor-pointer',
                  value === 'this-month'
                    ? 'bg-accent/10 text-accent font-semibold border border-accent/25'
                    : 'text-primary hover:bg-surface border border-transparent',
                )}
              >
                <span>This Month</span>
                {value === 'this-month' && <Icon name="check" className="text-accent text-xs" />}
              </button>
              <button
                type="button"
                onClick={() => choosePreset('last-month')}
                className={cn(
                  'h-8 px-2.5 rounded-[9px] text-xs font-medium transition-colors text-left flex items-center justify-between cursor-pointer',
                  value === 'last-month'
                    ? 'bg-accent/10 text-accent font-semibold border border-accent/25'
                    : 'text-primary hover:bg-surface border border-transparent',
                )}
              >
                <span>Last Month</span>
                {value === 'last-month' && <Icon name="check" className="text-accent text-xs" />}
              </button>
              <button
                type="button"
                onClick={() => choosePreset('year-to-date')}
                className={cn(
                  'h-8 px-2.5 rounded-[9px] text-xs font-medium transition-colors text-left flex items-center justify-between cursor-pointer',
                  value === 'year-to-date'
                    ? 'bg-accent/10 text-accent font-semibold border border-accent/25'
                    : 'text-primary hover:bg-surface border border-transparent',
                )}
              >
                <span>Year to Date</span>
                {value === 'year-to-date' && <Icon name="check" className="text-accent text-xs" />}
              </button>
            </div>

            {/* Custom Mode Tabs */}
            <div className="flex items-center gap-1 p-1 bg-surface rounded-[11px] border border-border/60 my-2.5">
              <button
                type="button"
                onClick={() => setSubMode('month')}
                className={cn(
                  'flex-1 py-1 px-1.5 rounded-[8px] text-[11px] font-semibold transition-all text-center cursor-pointer',
                  subMode === 'month'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-secondary hover:text-primary',
                )}
              >
                Select Month
              </button>
              <button
                type="button"
                onClick={() => setSubMode('date')}
                className={cn(
                  'flex-1 py-1 px-1.5 rounded-[8px] text-[11px] font-semibold transition-all text-center cursor-pointer',
                  subMode === 'date'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-secondary hover:text-primary',
                )}
              >
                Select Date
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubMode('range');
                  setRangeStart(null);
                }}
                className={cn(
                  'flex-1 py-1 px-1.5 rounded-[8px] text-[11px] font-semibold transition-all text-center cursor-pointer',
                  subMode === 'range'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-secondary hover:text-primary',
                )}
              >
                Custom Range
              </button>
            </div>

            {/* SubMode 1: Select Month */}
            {subMode === 'month' && (
              <div>
                <div className="flex items-center justify-between pb-1.5">
                  <button
                    type="button"
                    aria-label="Previous year"
                    onClick={() => setMonthYear((y) => y - 1)}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[8px] text-secondary hover:bg-surface hover:text-primary transition-colors cursor-pointer"
                  >
                    <Icon name="chevron-left" className="text-xs" />
                  </button>
                  <span className="text-xs sm:text-sm font-bold text-primary tracking-tight">{monthYear}</span>
                  <button
                    type="button"
                    aria-label="Next year"
                    onClick={() => setMonthYear((y) => y + 1)}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[8px] text-secondary hover:bg-surface hover:text-primary transition-colors cursor-pointer"
                  >
                    <Icon name="chevron-right" className="text-xs" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {monthNames.map((name, index) => {
                    const monthKey = `${monthYear}-${String(index + 1).padStart(2, '0')}`;
                    const isSelected = value === `month:${monthKey}`;
                    const isCurrent = bounds.currentMonth === monthKey;

                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => chooseMonth(index)}
                        className={cn(
                          'h-8.5 rounded-[9px] text-xs font-medium transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-accent text-white font-semibold shadow-sm'
                            : isCurrent
                              ? 'border border-accent/60 bg-accent/5 text-accent font-semibold hover:bg-accent/10'
                              : 'text-primary hover:bg-surface',
                        )}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SubMode 2: Select Date */}
            {subMode === 'date' && (
              <div>
                <div className="flex items-center justify-between pb-1.5">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[8px] text-secondary hover:bg-surface hover:text-primary transition-colors cursor-pointer"
                  >
                    <Icon name="chevron-left" className="text-xs" />
                  </button>
                  <span className="text-xs sm:text-sm font-bold text-primary tracking-tight">{calendarMonthLabel}</span>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[8px] text-secondary hover:bg-surface hover:text-primary transition-colors cursor-pointer"
                  >
                    <Icon name="chevron-right" className="text-xs" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {weekdayLabels.map((lbl) => (
                    <span key={lbl} className="flex h-6 items-center justify-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-secondary/80">
                      {lbl}
                    </span>
                  ))}
                  {calendarDays.map((date) => {
                    const ymd = toYmd(date);
                    const inMonth = date.getMonth() === calendarMonth.getMonth();
                    const isSelected = value === `date:${ymd}`;
                    const isToday = ymd === bounds.today;

                    return (
                      <button
                        key={ymd}
                        type="button"
                        onClick={() => chooseDate(date)}
                        className={cn(
                          'flex h-7.5 sm:h-8 items-center justify-center rounded-[8px] text-xs font-medium transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-accent text-white font-semibold shadow-sm'
                            : isToday
                              ? 'border border-accent/60 bg-accent/5 text-accent font-semibold hover:bg-accent/10'
                              : inMonth
                                ? 'text-primary hover:bg-surface'
                                : 'text-secondary/35 hover:bg-surface/50',
                        )}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SubMode 3: Custom Range */}
            {subMode === 'range' && (
              <div>
                <div className="flex items-center justify-between pb-1 px-0.5">
                  <span className="text-[11px] font-semibold text-secondary">
                    {rangeStart ? 'Click end date' : 'Click start date'}
                  </span>
                  {rangeStart && (
                    <button
                      type="button"
                      onClick={() => setRangeStart(null)}
                      className="text-[10px] font-semibold text-accent hover:underline cursor-pointer"
                    >
                      Reset start
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between pb-1.5">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[8px] text-secondary hover:bg-surface hover:text-primary transition-colors cursor-pointer"
                  >
                    <Icon name="chevron-left" className="text-xs" />
                  </button>
                  <span className="text-xs sm:text-sm font-bold text-primary tracking-tight">{calendarMonthLabel}</span>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[8px] text-secondary hover:bg-surface hover:text-primary transition-colors cursor-pointer"
                  >
                    <Icon name="chevron-right" className="text-xs" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {weekdayLabels.map((lbl) => (
                    <span key={lbl} className="flex h-6 items-center justify-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-secondary/80">
                      {lbl}
                    </span>
                  ))}
                  {calendarDays.map((date) => {
                    const ymd = toYmd(date);
                    const inMonth = date.getMonth() === calendarMonth.getMonth();

                    // Calculate range highlight
                    let isRangeStart = false;
                    let isRangeEnd = false;
                    let isInRange = false;

                    if (rangeStart) {
                      isRangeStart = ymd === rangeStart;
                      if (hoverDate) {
                        const low = rangeStart < hoverDate ? rangeStart : hoverDate;
                        const high = rangeStart < hoverDate ? hoverDate : rangeStart;
                        isRangeEnd = ymd === hoverDate;
                        isInRange = ymd > low && ymd < high;
                      }
                    } else if (value.startsWith('range:')) {
                      const [from, to] = value.slice(6).split(':');
                      isRangeStart = ymd === from;
                      isRangeEnd = ymd === to;
                      isInRange = ymd > from && ymd < to;
                    }

                    const isToday = ymd === bounds.today;

                    return (
                      <button
                        key={ymd}
                        type="button"
                        onMouseEnter={() => rangeStart && setHoverDate(ymd)}
                        onClick={() => handleRangeDateClick(date)}
                        className={cn(
                          'flex h-7.5 sm:h-8 items-center justify-center text-xs font-medium transition-colors cursor-pointer',
                          isRangeStart && isRangeEnd
                            ? 'bg-accent text-white font-semibold rounded-[8px]'
                            : isRangeStart
                              ? 'bg-accent text-white font-semibold rounded-l-[8px]'
                              : isRangeEnd
                                ? 'bg-accent text-white font-semibold rounded-r-[8px]'
                                : isInRange
                                  ? 'bg-accent/15 text-accent rounded-none'
                                  : isToday
                                    ? 'border border-accent/60 bg-accent/5 text-accent font-semibold hover:bg-accent/10 rounded-[8px]'
                                    : inMonth
                                      ? 'text-primary hover:bg-surface rounded-[8px]'
                                      : 'text-secondary/35 hover:bg-surface/50 rounded-[8px]',
                        )}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );

      return position?.popoverHost
        ? createPortal(popoverNode, position.popoverHost)
        : popoverNode;
    })()}
  </div>
);
}

export default TransactionDateFilter;
