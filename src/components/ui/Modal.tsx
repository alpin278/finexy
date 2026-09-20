import { useEffect, useId, type ReactNode } from 'react';
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 sm:p-6', isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')} aria-hidden={!isOpen} inert={!isOpen ? true : undefined}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primary/30 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Dialog box */}
      <div
        className={cn(
          'relative w-full bg-white rounded-[24px] border border-border',
          'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-10 overflow-hidden flex flex-col',
          'transition-[opacity,transform] duration-200',
          isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-1 scale-[0.985] opacity-0',
          maxWidths[maxWidth]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            {title && <h3 id={titleId} className="text-lg font-semibold text-primary">{title}</h3>}
            {description && <p id={descriptionId} className="text-xs text-secondary mt-0.5">{description}</p>}
          </div>
          <IconButton
            aria-label="Close modal"
            size="sm"
            onClick={onClose}
            className="text-secondary hover:text-primary"
          >
            <Icon name="x-lg" className="text-sm" />
          </IconButton>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-surface border-t border-border flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
