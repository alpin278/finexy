import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', hoverable = false, children, ...props }, ref) => {
    const paddings = {
      none: 'p-0',
      sm: 'p-4 sm:p-5',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-[20px] border border-border',
          'shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)]',
          hoverable &&
            'transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-border/80',
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
