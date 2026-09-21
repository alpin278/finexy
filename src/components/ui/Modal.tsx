import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { IconButton } from './IconButton';
import { Icon } from './Icon';

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
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
      document.body.style.overflow = previousOverflow;
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
        className="fixed inset-0 bg-primary/45 backdrop-blur-[3px] modal-backdrop-enter"
        onClick={onClose}
      />

      {/* Dialog box */}
      <div
        className={cn(
          'relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-visible rounded-[24px] border border-white/80 bg-white ring-1 ring-primary/5 sm:max-h-[min(88dvh,760px)]',
          'shadow-[0_28px_80px_rgba(23,23,20,0.2),0_10px_28px_rgba(23,23,20,0.1)]',
          'modal-panel-enter transition-[opacity,transform] duration-200',
          maxWidths[maxWidth]
        )}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-surface/65 px-5 py-5 sm:px-6 sm:py-6">
          <div className="min-w-0 pr-1">
            {title && <h3 id={titleId} className="text-lg font-semibold text-primary">{title}</h3>}
            {description && <p id={descriptionId} className="text-xs text-secondary mt-0.5">{description}</p>}
          </div>
          <IconButton
            ref={closeButtonRef}
            aria-label="Close modal"
            size="sm"
            onClick={onClose}
            className="shrink-0 text-secondary hover:text-primary"
          >
            <Icon name="x-lg" className="text-sm" />
          </IconButton>
        </div>

        {/* Content */}
        <div data-popover-scroll-root className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border/70 bg-surface/75 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
        <div data-modal-popover-layer className="pointer-events-none absolute inset-0 z-30" />
      </div>
    </div>,
    document.body
  );
}
