import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface IconProps extends HTMLAttributes<HTMLElement> {
  name: string;
}
/** Finexy's single icon surface. Keep iconography on Bootstrap Icons. */
export function Icon({ name, className, ...props }: IconProps) {
  const iconName = name.startsWith('bi-') ? name : `bi-${name}`;
  return <i className={cn('bi', iconName, className)} aria-hidden="true" {...props} />;
}
