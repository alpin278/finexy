import type { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

interface SettingsSectionProps {
  id?: string;
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({ id, icon, eyebrow, title, description, children, className }: SettingsSectionProps) {
  return (
    <Card id={id} className={`scroll-mt-6 ${className ?? ''}`} padding="none">
      <div className="flex items-start gap-3 border-b border-border px-5 py-5 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon name={icon} className="text-lg" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">{eyebrow}</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-primary">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-secondary">{description}</p>
        </div>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </Card>
  );
}
