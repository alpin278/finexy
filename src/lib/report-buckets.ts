export type ReportBucketRange = { start: string; end: string };
import { browserTimeZone, getLocalDateKey } from './date-time';

function calendarDate(day: string) { const [year, month, date] = day.split('-').map(Number); return new Date(Date.UTC(year, month - 1, date)); }
function plusDays(day: string, days: number) { const date = calendarDate(day); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); }
function dayOfWeek(day: string) { return calendarDate(day).getUTCDay(); }
function daySpan(start: string, end: string) { return Math.round((calendarDate(end).getTime() - calendarDate(start).getTime()) / 86400000); }
const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });

export function reportBucketForOccurredAt(occurredAt: string, range: ReportBucketRange, timeZone = browserTimeZone()) {
  const start = getLocalDateKey(range.start, timeZone);
  const end = getLocalDateKey(range.end, timeZone);
  const days = daySpan(start, end);
  const day = getLocalDateKey(occurredAt, timeZone);
  if (days <= 31) return { key: day, label: dayFormatter.format(calendarDate(day)) };
  if (days <= 92) {
    const monday = plusDays(day, -((dayOfWeek(day) + 6) % 7));
    return { key: monday, label: dayFormatter.format(calendarDate(monday)) };
  }
  const month = `${day.slice(0, 7)}-01`;
  return { key: month, label: monthFormatter.format(calendarDate(month)) };
}
