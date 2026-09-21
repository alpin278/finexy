import { cn } from '../../lib/utils';

export function AmountValue({ value, className }: { value: string; className?: string }) {
  const match = value.match(/^([^\d]*)(\d.*)$/u);
  const prefix = match?.[1] ?? '';
  const number = match?.[2] ?? value;

  return (
    <span className={cn('inline-flex max-w-full flex-wrap items-baseline [font-variant-numeric:tabular-nums]', className)}>
      {prefix && <span className="whitespace-nowrap">{prefix}</span>}
      <span className="whitespace-nowrap">{number}</span>
    </span>
  );
}
