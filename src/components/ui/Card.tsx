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
          'bg-white rounded-[20px] border border-border shadow-card',
          hoverable &&
            'cursor-pointer transition-[border-color,box-shadow,transform] duration-180 ease-out hover:-translate-y-0.5 hover:border-border-hover hover:shadow-elevated active:translate-y-0',
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
