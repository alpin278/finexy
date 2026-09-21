export type ReportBucketRange = { start: string; end: string };
const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const startOfUtcDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const plusDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};
const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });

export function reportBucketForOccurredAt(occurredAt: string, range: ReportBucketRange) {
  const days = Math.round((new Date(range.end).getTime() - new Date(range.start).getTime()) / 86400000);
  const day = new Date(occurredAt);
  if (days <= 31) return { key: isoDay(day), label: dayFormatter.format(day) };
  if (days <= 92) {
    const monday = plusDays(startOfUtcDay(day), -((day.getUTCDay() + 6) % 7));
    return { key: isoDay(monday), label: dayFormatter.format(monday) };
  }
  const month = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1)); return { key: isoDay(month), label: monthFormatter.format(month) };
}
