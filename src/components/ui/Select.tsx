import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';
import { calculateModalPopoverPosition, useAnchoredPopoverPosition, type ModalPopoverPosition } from './popoverPosition';
import { moveSelectIndex } from './selectPosition';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'multiple' | 'size'> {
  options: SelectOption[];
  icon?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    options,
    icon,
    style,
    id,
    value,
    defaultValue,
    onChange,
    disabled,
    name,
    required,
    form,
    title,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    'aria-invalid': ariaInvalid,
    ...selectProps
  }, forwardedRef) => {
    const generatedId = useId();
    const triggerId = id ?? `select-${generatedId}`;
    const listboxId = `${triggerId}-listbox`;
    const nativeSelectRef = useRef<HTMLSelectElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const closeTimerRef = useRef<number | null>(null);
    const isControlled = value !== undefined;
    const initialValue = String(value ?? defaultValue ?? options[0]?.value ?? '');
    const [internalValue, setInternalValue] = useState(initialValue);
    const selectedValue = isControlled ? String(value ?? '') : internalValue;
    const selectedIndex = options.findIndex((option) => option.value === selectedValue);
    const selectedOption = options[selectedIndex] ?? options[0];
    const [activeIndex, setActiveIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [localPosition, setLocalPosition] = useState<ModalPopoverPosition | null>(null);
    const [modalScrollRoot, setModalScrollRoot] = useState<HTMLElement | null>(null);
    const [popoverContainer, setPopoverContainer] = useState<HTMLElement | null>(null);
    const fullWidth = className?.split(/\s+/).includes('w-full');
    const positioning = useMemo(() => ({ contentHeight: Math.max(14, options.length * 37 + 14) }), [options.length]);
    const isModalLocal = Boolean(modalScrollRoot);
    const position = useAnchoredPopoverPosition(isMounted && !isModalLocal, triggerRef, positioning);

    useImperativeHandle(forwardedRef, () => nativeSelectRef.current as HTMLSelectElement, []);

    const clearScheduledClose = useCallback(() => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }, []);

    const openMenu = useCallback(() => {
      if (disabled || !options.length) return;
      if (import.meta.env.DEV) {
        performance.clearMarks('select_open_start');
        performance.clearMarks('select_position_ready');
        performance.clearMarks('select_visible');
        performance.clearMeasures('select_open_latency');
        performance.mark('select_open_start');
      }
      clearScheduledClose();
      const scrollRoot = triggerRef.current?.closest<HTMLElement>('[data-popover-scroll-root]');
      setModalScrollRoot(scrollRoot ?? null);
      setPopoverContainer(scrollRoot ? triggerRef.current?.parentElement ?? null : null);
      setLocalPosition(scrollRoot && triggerRef.current
        ? calculateModalPopoverPosition(triggerRef.current.getBoundingClientRect(), scrollRoot.getBoundingClientRect(), positioning)
        : null);
      if (import.meta.env.DEV) performance.mark('select_position_ready');
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      setIsMounted(true);
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = window.requestAnimationFrame(() => setIsVisible(true));
    }, [clearScheduledClose, disabled, options.length, positioning, selectedIndex]);

    const closeMenu = useCallback(() => {
      if (!isMounted) return;
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
      setIsVisible(false);
      clearScheduledClose();
      closeTimerRef.current = window.setTimeout(() => {
        setIsMounted(false);
        setLocalPosition(null);
        setModalScrollRoot(null);
        setPopoverContainer(null);
        closeTimerRef.current = null;
      }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 120);
    }, [clearScheduledClose, isMounted]);

    useEffect(() => {
      if (!isMounted || !modalScrollRoot || !triggerRef.current) return undefined;
      const updateLocalPosition = () => setLocalPosition(calculateModalPopoverPosition(triggerRef.current!.getBoundingClientRect(), modalScrollRoot.getBoundingClientRect(), positioning));
      window.addEventListener('resize', updateLocalPosition);
      return () => window.removeEventListener('resize', updateLocalPosition);
    }, [isMounted, modalScrollRoot, positioning]);

    useLayoutEffect(() => {
      if (!isVisible || !import.meta.env.DEV) return;
      performance.mark('select_visible');
      performance.measure('select_open_latency', 'select_open_start', 'select_visible');
    }, [isVisible]);

    useEffect(() => {
      if (!isMounted) return undefined;
      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) closeMenu();
      };
      document.addEventListener('pointerdown', handlePointerDown);
      return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [closeMenu, isMounted]);

    useEffect(() => {
      if (!isVisible || activeIndex < 0) return;
      menuRef.current?.querySelector<HTMLElement>(`#${CSS.escape(`${listboxId}-option-${activeIndex}`)}`)?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, isVisible, listboxId]);

    useEffect(() => () => {
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    }, []);

    const chooseOption = (nextValue: string) => {
      if (!isControlled) setInternalValue(nextValue);
      const select = nativeSelectRef.current;
      if (select) {
        select.value = nextValue;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      closeMenu();
      triggerRef.current?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!isVisible) openMenu();
        else setActiveIndex((current) => moveSelectIndex(current, options.length, event.key === 'ArrowDown' ? 1 : -1));
        return;
      }
      if (event.key === 'Home' && isVisible) {
        event.preventDefault();
        setActiveIndex(0);
        return;
      }
      if (event.key === 'End' && isVisible) {
        event.preventDefault();
        setActiveIndex(options.length - 1);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!isVisible) openMenu();
        else if (options[activeIndex]) chooseOption(options[activeIndex].value);
        return;
      }
      if (event.key === 'Escape' && isVisible) {
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
        return;
      }
      if (event.key === 'Tab') closeMenu();
    };

    return (
      <div className={cn('group relative items-center', fullWidth ? 'flex w-full' : 'inline-flex')}>
        <select
          ref={nativeSelectRef}
          value={selectedValue}
          onChange={onChange}
          name={name}
          required={required}
          form={form}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          hidden
          className="hidden"
          {...selectProps}
        >
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          role="combobox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-describedby={ariaDescribedby}
          aria-invalid={ariaInvalid}
          aria-required={required || undefined}
          aria-expanded={isVisible}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-activedescendant={isVisible && options[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
          disabled={disabled}
          title={title}
          style={style}
          onClick={() => isVisible ? closeMenu() : openMenu()}
          onKeyDown={handleKeyDown}
          className={cn(
            'relative flex h-10 min-w-0 cursor-pointer items-center rounded-[12px] border border-border bg-white pl-3.5 pr-10 text-left text-xs font-semibold text-primary shadow-[0_1px_2px_rgba(23,23,20,0.04)]',
            'transition-[border-color,box-shadow] duration-150 hover:border-border-hover focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15',
            'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-secondary disabled:opacity-70',
            'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:border-danger aria-[invalid=true]:focus:ring-danger/15',
            icon && 'pl-8',
            className,
          )}
        >
          {icon && <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center">{icon}</span>}
          <span className="min-w-0 flex-1 truncate">{selectedOption?.label ?? 'Select an option'}</span>
          <Icon name="chevron-down" className={cn('pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-secondary transition-transform duration-150', isVisible && 'rotate-180 text-accent')} />
        </button>

        {isMounted && createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabel ? undefined : ariaLabelledby ?? triggerId}
            aria-hidden={!isVisible}
            className={cn(
              isModalLocal ? 'absolute z-40 overflow-y-auto rounded-[14px] border border-border bg-white p-1.5 shadow-dropdown' : 'fixed z-[80] overflow-y-auto rounded-[14px] border border-border bg-white p-1.5 shadow-dropdown',
              'transition-[opacity,transform] ease-out',
              isVisible ? 'pointer-events-auto translate-y-0 scale-100 opacity-100 duration-[160ms]' : 'pointer-events-none -translate-y-1 scale-[0.98] opacity-0 duration-[120ms]',
            )}
            style={isModalLocal
              ? localPosition ? {
                [localPosition.placement === 'top' ? 'bottom' : 'top']: 'calc(100% + 6px)',
                [localPosition.alignment]: 0,
                width: localPosition.width,
                maxHeight: localPosition.maxHeight,
                transformOrigin: localPosition.placement === 'top' ? 'bottom center' : 'top center',
              } : { visibility: 'hidden' }
              : position ? {
                top: position.top,
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
                transformOrigin: position.placement === 'top' ? 'bottom center' : 'top center',
              } : { visibility: 'hidden' }}
          >
            {options.map((option, index) => {
              const selected = option.value === selectedValue;
              const active = index === activeIndex;
              return <div
                key={option.value}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={selected}
                onPointerMove={() => setActiveIndex(index)}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => chooseOption(option.value)}
                className={cn(
                  'flex cursor-pointer select-none items-center gap-2 rounded-[10px] px-3 py-2.5 text-xs text-primary outline-none transition-colors duration-100',
                  selected ? 'bg-accent/10 font-semibold text-primary' : active ? 'bg-surface font-medium' : 'hover:bg-surface',
                )}
              >
                {option.icon && <span className="flex shrink-0 items-center text-secondary">{option.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {selected && <Icon name="check-lg" className="shrink-0 text-accent" />}
              </div>;
            })}
          </div>,
          isModalLocal ? popoverContainer ?? document.body : document.body,
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
