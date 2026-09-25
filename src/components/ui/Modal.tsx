import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';
import { ModalContext } from './ModalContext';
import { lockBodyScroll } from '../../lib/scroll-lock';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
  const [popoverLayer, setPopoverLayer] = useState<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!isOpen) return undefined;

    previousActiveElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlockScroll = lockBodyScroll();
    const focusTimer = window.requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]):not([hidden]), [href]:not([hidden]), input:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"]):not([hidden])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      unlockScroll();
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center p-3 transition-opacity duration-200 sm:p-6', isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')} aria-hidden={!isOpen} inert={!isOpen ? true : undefined}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 dark:bg-black/75 backdrop-blur-[2px] modal-backdrop-enter"
        onClick={onClose}
      />

      {/* Dialog box */}
      <div
        className={cn(
          'relative z-10 flex isolate max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-visible rounded-[24px] border border-border dark:border-[#2E2E28] bg-card ring-1 ring-border/20 dark:ring-white/5 sm:max-h-[min(88dvh,760px)]',
          'shadow-[0_28px_80px_rgba(23,23,20,0.2),0_10px_28px_rgba(23,23,20,0.1)] dark:shadow-[0_28px_80px_rgba(0,0,0,0.65),0_10px_28px_rgba(0,0,0,0.4)]',
          'modal-panel-enter transition-[opacity,transform] duration-200',
          maxWidths[maxWidth]
        )}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
      >
        <ModalContext.Provider value={{ popoverLayer }}>
          {/* The opaque surface is clipped; the transparent popover layer remains free to escape it. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[23px] bg-card">
            {/* Header: slightly distinct / elevated without hard seam */}
            <div className="flex items-start justify-between gap-4 border-b border-border/70 dark:border-[#2E2E28] bg-surface/80 dark:bg-[#1E1E1A] px-5 py-5 sm:px-6 sm:py-6">
              <div className="min-w-0 pr-1">
                {title && <h3 id={titleId} className="text-lg font-semibold text-primary dark:text-[#F2F2EE]">{title}</h3>}
                {description && <p id={descriptionId} className="text-xs text-secondary dark:text-[#9C9C94] mt-0.5">{description}</p>}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close modal"
                onClick={onClose}
                className={cn(
                  'group flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  'border border-border/80 bg-surface text-secondary',
                  'dark:border-[#34342C] dark:bg-[#262622] dark:text-[#9C9C94]',
                  'transition-all duration-150 cursor-pointer',
                  'hover:border-accent/40 hover:bg-accent/10 hover:text-primary dark:hover:border-accent/50 dark:hover:text-[#F2F2EE]',
                  'active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent/50'
                )}
              >
                <Icon name="x-lg" className="text-xs transition-colors duration-150 group-hover:text-accent dark:group-hover:text-accent" />
              </button>
            </div>
            {/* Content with refined dark scrollbar */}
            <div data-popover-scroll-root className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6 modal-scrollbar">{children}</div>

            {/* Footer: integrated with body rather than separate black slab */}
            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border/70 dark:border-[#2E2E28] bg-card dark:bg-[#20201C] px-5 py-4 sm:px-6">
                {footer}
              </div>
            )}
          </div>
          <div ref={setPopoverLayer} data-modal-popover-layer className="pointer-events-none" style={{ display: 'contents' }} />
        </ModalContext.Provider>
      </div>
    </div>,
    document.body
  );
}
