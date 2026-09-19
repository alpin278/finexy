import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';

interface SettingsSectionProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({ icon: Icon, eyebrow, title, description, children, className }: SettingsSectionProps) {
  return (
    <Card className={className} padding="none">
      <div className="flex items-start gap-3 border-b border-border px-5 py-5 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon className="h-5 w-5" aria-hidden="true" />
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
