import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';
import { calculateModalPopoverPosition, useAnchoredPopoverPosition, type ModalPopoverPosition } from './popoverPosition';

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
  const [localPosition, setLocalPosition] = useState<ModalPopoverPosition | null>(null);
  const [modalScrollRoot, setModalScrollRoot] = useState<HTMLElement | null>(null);
  const [popoverContainer, setPopoverContainer] = useState<HTMLElement | null>(null);
  const positioning = useMemo(() => ({ contentHeight: 356, minWidth: 304, preferredMaxHeight: 380 }), []);
  const isModalLocal = Boolean(modalScrollRoot);
  const position = useAnchoredPopoverPosition(open && !isModalLocal, triggerRef, positioning);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    setLocalPosition(null);
    setModalScrollRoot(null);
    setPopoverContainer(null);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const focusDate = useCallback((date: Date) => {
    const key = localDateValue(date);
    window.requestAnimationFrame(() => dayRefs.current.get(key)?.focus());
  }, []);

  const openCalendar = () => {
    if (disabled) return;
    const scrollRoot = triggerRef.current?.closest<HTMLElement>('[data-popover-scroll-root]');
    setModalScrollRoot(scrollRoot ?? null);
    setPopoverContainer(scrollRoot ? triggerRef.current?.parentElement ?? null : null);
    setLocalPosition(scrollRoot && triggerRef.current
      ? calculateModalPopoverPosition(triggerRef.current.getBoundingClientRect(), scrollRoot.getBoundingClientRect(), positioning)
      : null);
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

  useEffect(() => {
    if (!open || !modalScrollRoot || !triggerRef.current) return undefined;
    const updateLocalPosition = () => setLocalPosition(calculateModalPopoverPosition(triggerRef.current!.getBoundingClientRect(), modalScrollRoot.getBoundingClientRect(), positioning));
    window.addEventListener('resize', updateLocalPosition);
    return () => window.removeEventListener('resize', updateLocalPosition);
  }, [modalScrollRoot, open, positioning]);

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
        onClick={() => open ? close(false) : openCalendar()}
        className={cn(
          'relative flex h-10 w-full items-center rounded-[12px] border border-border bg-white px-3.5 pr-10 text-left text-sm text-primary',
          'transition-[border-color,background-color,box-shadow] duration-150 hover:border-border-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15',
          'disabled:cursor-not-allowed disabled:bg-surface disabled:text-secondary',
          error && 'border-danger focus:border-danger focus:ring-danger/15',
          className,
        )}
      >
        <span className={cn('min-w-0 flex-1 truncate', !selectedDate && 'text-secondary/70')}>{selectedDate ? fieldDateFormatter.format(selectedDate) : placeholder}</span>
        <Icon name="calendar3" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary" />
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      {open && createPortal(
        <div
          ref={popoverRef}
          id={dialogId}
          role="dialog"
          aria-label="Choose date"
          className={cn(isModalLocal ? 'absolute z-40 w-[min(304px,calc(100vw-1rem))] rounded-[16px] border border-border bg-white p-3 shadow-dropdown' : 'fixed z-[80] w-[min(304px,calc(100vw-1rem))] rounded-[16px] border border-border bg-white p-3 shadow-dropdown')}
          style={isModalLocal
            ? localPosition ? {
              [localPosition.placement === 'top' ? 'bottom' : 'top']: 'calc(100% + 6px)',
              [localPosition.alignment]: 0,
              width: localPosition.width,
              maxHeight: localPosition.maxHeight,
            } : { visibility: 'hidden' }
            : position ? { top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight } : { visibility: 'hidden' }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button type="button" aria-label="Previous month" onClick={() => setDisplayMonth((month) => addMonths(month, -1))} className="flex h-8 w-8 items-center justify-center rounded-[10px] text-secondary hover:bg-surface hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"><Icon name="chevron-left" /></button>
            <p className="text-sm font-semibold text-primary" aria-live="polite">{monthFormatter.format(displayMonth)}</p>
            <button type="button" aria-label="Next month" onClick={() => setDisplayMonth((month) => addMonths(month, 1))} className="flex h-8 w-8 items-center justify-center rounded-[10px] text-secondary hover:bg-surface hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"><Icon name="chevron-right" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={monthFormatter.format(displayMonth)}>
            {weekdayLabels.map((label) => <span key={label} className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-secondary" aria-hidden="true">{label}</span>)}
            {days.map((date) => {
              const dateValue = localDateValue(date);
              const inMonth = date.getMonth() === displayMonth.getMonth();
              const selected = dateValue === value;
              const today = dateValue === todayValue;
              return <button
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
                  'flex h-9 items-center justify-center rounded-[10px] text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30',
                  selected ? 'bg-accent text-white hover:bg-accent-hover' : today ? 'bg-accent/10 text-accent hover:bg-accent/15' : 'text-primary hover:bg-surface',
                  !inMonth && !selected && 'text-secondary/45',
                )}
              >{date.getDate()}</button>;
            })}
          </div>
          <div className="mt-2 flex justify-between border-t border-border/70 pt-2">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => { const today = new Date(); setDisplayMonth(firstOfMonth(today)); choose(today); }} className="rounded-lg px-2 py-1 text-xs font-semibold text-accent hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/20">Today</button>
              {clearable && value && <button type="button" onClick={() => { onChange(''); close(); }} className="rounded-lg px-2 py-1 text-xs font-semibold text-secondary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20">Clear</button>}
            </div>
            <button type="button" onClick={() => close()} className="rounded-lg px-2 py-1 text-xs font-semibold text-secondary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20">Close</button>
          </div>
        </div>,
        isModalLocal ? popoverContainer ?? document.body : document.body,
      )}
    </div>
  );
}
