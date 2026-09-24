import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';
import { useAnchoredPopoverPosition } from './popoverPosition';

export interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const fullDateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' });
const fieldDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function localDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function firstOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Select date',
  clearable = false,
  disabled,
  required,
  error,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}: DatePickerProps) {
  const generatedId = useId();
  const triggerId = id ?? `date-picker-${generatedId}`;
  const dialogId = `${triggerId}-calendar`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const selectedDate = parseLocalDate(value);
  const [open, setOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => firstOfMonth(selectedDate ?? new Date()));

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const positioning = useMemo(
    () => ({
      contentHeight: 295,
      minWidth: 320,
      preferredMaxHeight: 310,
      flip: true,
      align: 'auto' as const,
      onClose: close,
    }),
    [close],
  );
  const position = useAnchoredPopoverPosition(open, triggerRef, positioning, popoverRef, close);

  const focusDate = useCallback((date: Date) => {
    const key = localDateValue(date);
    window.requestAnimationFrame(() => dayRefs.current.get(key)?.focus());
  }, []);

  const openCalendar = () => {
    if (disabled) return;
    setDisplayMonth(firstOfMonth(selectedDate ?? new Date()));
    setOpen(true);
    window.requestAnimationFrame(() => focusDate(selectedDate ?? new Date()));
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) close(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [close, open]);

  const monthStart = firstOfMonth(displayMonth);
  const gridStart = addDays(monthStart, -monthStart.getDay());
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const todayValue = localDateValue(new Date());

  const choose = (date: Date) => {
    onChange(localDateValue(date));
    close();
  };

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    let next: Date | null = null;
    if (event.key === 'ArrowLeft') next = addDays(date, -1);
    if (event.key === 'ArrowRight') next = addDays(date, 1);
    if (event.key === 'ArrowUp') next = addDays(date, -7);
    if (event.key === 'ArrowDown') next = addDays(date, 7);
    if (event.key === 'Home') next = addDays(date, -date.getDay());
    if (event.key === 'End') next = addDays(date, 6 - date.getDay());
    if (event.key === 'PageUp') next = addMonths(date, event.shiftKey ? -12 : -1);
    if (event.key === 'PageDown') next = addMonths(date, event.shiftKey ? 12 : 1);
    if (!next) return;
    event.preventDefault();
    if (next.getMonth() !== displayMonth.getMonth() || next.getFullYear() !== displayMonth.getFullYear()) setDisplayMonth(firstOfMonth(next));
    focusDate(next);
  };

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-expanded={open}
        aria-controls={dialogId}
        aria-haspopup="dialog"
        disabled={disabled}
        style={position?.triggerStyle}
        onClick={() => (open ? close(false) : openCalendar())}
        className={cn(
          'relative flex h-10 w-full items-center rounded-[12px] border border-border bg-white px-3.5 pr-10 text-left text-sm text-primary',
          'transition-[border-color,background-color,box-shadow] duration-150 hover:border-border-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 cursor-pointer',
          'disabled:cursor-not-allowed disabled:bg-surface disabled:text-secondary',
          error && 'border-danger focus:border-danger focus:ring-danger/15',
          className,
        )}
      >
        <span className={cn('min-w-0 flex-1 truncate', !selectedDate && 'text-secondary/70')}>{selectedDate ? fieldDateFormatter.format(selectedDate) : placeholder}</span>
        <Icon name="calendar3" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary" />
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      {open && (() => {
        const popoverNode = (
          <div
            style={position?.popoverStyle}
            className="pointer-events-none"
          >
            <div
              ref={popoverRef}
              id={dialogId}
              role="dialog"
              aria-label="Choose date"
              onWheel={(e) => e.stopPropagation()}
              className="pointer-events-auto w-[320px] max-w-[calc(100vw-2rem)] rounded-[14px] border border-border bg-white p-3 shadow-dropdown transition-opacity duration-100 ease-out"
            >
              {/* Header: < Month Year > */}
              <div className="mb-1.5 flex items-center justify-between gap-1 px-0.5">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setDisplayMonth((month) => addMonths(month, -1))}
                  className="flex h-6.5 w-6.5 items-center justify-center rounded-[6px] text-secondary hover:bg-surface hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors cursor-pointer"
                >
                  <Icon name="chevron-left" className="text-[11px]" />
                </button>
                <p className="text-xs font-bold text-primary tracking-tight" aria-live="polite">
                  {monthFormatter.format(displayMonth)}
                </p>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setDisplayMonth((month) => addMonths(month, 1))}
                  className="flex h-6.5 w-6.5 items-center justify-center rounded-[6px] text-secondary hover:bg-surface hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors cursor-pointer"
                >
                  <Icon name="chevron-right" className="text-[11px]" />
                </button>
              </div>

              {/* Weekday Row */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1" role="grid" aria-label={monthFormatter.format(displayMonth)}>
                {weekdayLabels.map((label) => (
                  <span key={label} className="flex h-4.5 items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-secondary/65" aria-hidden="true">
                    {label}
                  </span>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((date) => {
                  const dateValue = localDateValue(date);
                  const inMonth = date.getMonth() === displayMonth.getMonth();
                  const selected = dateValue === value;
                  const today = dateValue === todayValue;

                  return (
                    <button
                      key={dateValue}
                      ref={(node) => { if (node) dayRefs.current.set(dateValue, node); else dayRefs.current.delete(dateValue); }}
                      type="button"
                      role="gridcell"
                      aria-label={fullDateFormatter.format(date)}
                      aria-selected={selected}
                      tabIndex={selected || (!selectedDate && today) ? 0 : -1}
                      onKeyDown={(event) => handleDayKeyDown(event, date)}
                      onClick={() => choose(date)}
                      className={cn(
                        'flex h-8 items-center justify-center rounded-[8px] text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/25 border border-transparent',
                        selected
                          ? 'bg-accent text-white font-semibold shadow-sm hover:bg-accent-hover'
                          : today
                            ? 'border-accent/50 bg-accent/5 text-accent font-semibold hover:bg-accent/10'
                            : inMonth
                              ? 'text-primary hover:bg-surface active:scale-95'
                              : 'text-secondary/35 hover:bg-surface/50',
                      )}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Action Row: Today only (no redundant Close button) */}
              <div className="mt-1.5 flex items-center justify-between border-t border-border/60 pt-1.5 px-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      setDisplayMonth(firstOfMonth(today));
                      choose(today);
                    }}
                    className="h-6.5 px-2 rounded-[6px] text-xs font-semibold text-accent hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                  {clearable && value && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange('');
                        close();
                      }}
                      className="h-6.5 px-2 rounded-[6px] text-xs font-semibold text-secondary hover:bg-surface hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
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

export default DatePicker;
