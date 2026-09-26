/**
 * Finexy's date boundary rules live here so an ISO timestamp is never
 * accidentally treated as a UTC calendar date in the UI.
 *
 * `occurred_at` and `created_at` are instants. Date-only values such as
 * budget periods and form dates are calendar values and must not go through
 * `new Date('YYYY-MM-DD')`.
 */

export const FALLBACK_TIME_ZONE = 'Asia/Jakarta';

export interface LocalCalendarParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

function validTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function browserTimeZone() {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolved && validTimeZone(resolved)) return resolved;
  } catch {
    // Use the product's existing regional fallback below.
  }
  return FALLBACK_TIME_ZONE;
}

/** Accepts the settings value `Asia/Jakarta (GMT+7)` as well as a raw IANA ID. */
export function resolveTimeZone(preferred?: string | null) {
  const candidate = preferred?.trim().split(/\s+/)[0];
  if (candidate && validTimeZone(candidate)) return candidate;
  return browserTimeZone();
}

function parseInstant(value: Date | string | number) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return Number(parts.find((item) => item.type === type)?.value ?? 0);
}

const calendarPartsFormatter = new Map<string, Intl.DateTimeFormat>();

function formatterForCalendarParts(timeZone: string) {
  const existing = calendarPartsFormatter.get(timeZone);
  if (existing) return existing;
  const formatter = new Intl.DateTimeFormat('en-US-u-nu-latn', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  calendarPartsFormatter.set(timeZone, formatter);
  return formatter;
}

export function getLocalCalendarParts(value: Date | string | number, timeZone = browserTimeZone()): LocalCalendarParts {
  const date = parseInstant(value);
  if (!date) throw new Error('Invalid timestamp.');
  const parts = formatterForCalendarParts(resolveTimeZone(timeZone)).formatToParts(date);
  return {
    year: part(parts, 'year'),
    month: part(parts, 'month'),
    day: part(parts, 'day'),
    hour: part(parts, 'hour'),
    minute: part(parts, 'minute'),
    second: part(parts, 'second'),
    millisecond: date.getMilliseconds(),
  };
}

export function getLocalDateKey(value: Date | string | number, timeZone = browserTimeZone()) {
  const parts = getLocalCalendarParts(value, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function getLocalMonthKey(value: Date | string | number, timeZone = browserTimeZone()) {
  return getLocalDateKey(value, timeZone).slice(0, 7);
}

export function formatLocalDate(value: Date | string | number, timeZone = browserTimeZone(), locale = 'en-US') {
  const date = parseInstant(value);
  if (!date) return 'Invalid date';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: resolveTimeZone(timeZone) }).format(date);
}

export function formatLocalTime(value: Date | string | number, timeZone = browserTimeZone(), locale = 'en-US') {
  const date = parseInstant(value);
  if (!date) return 'Invalid time';
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: resolveTimeZone(timeZone) }).format(date);
}

export function formatLocalDateTime(value: Date | string | number, timeZone = browserTimeZone(), locale = 'en-US') {
  const date = parseInstant(value);
  if (!date) return 'Invalid date';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: resolveTimeZone(timeZone),
  }).format(date);
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month, day };
}

export function isDateOnly(value: string) {
  return Boolean(parseDateOnly(value));
}

/** Format a stored `date`/`YYYY-MM-DD` without converting it through UTC. */
export function formatDateOnly(value: string, locale = 'en-US') {
  const parsed = parseDateOnly(value);
  if (!parsed) return value;
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)));
}

export function formatMonthKey(month: string, locale = 'en-US', monthStyle: 'short' | 'long' = 'long') {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return month;
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: monthStyle, year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

function timeZoneOffsetMinutes(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset', hour: '2-digit' }).formatToParts(value);
  const offset = parts.find((item) => item.type === 'timeZoneName')?.value ?? 'GMT';
  const match = /^GMT(?:([+-])(\d{1,2})(?::?(\d{2}))?)?$/.exec(offset);
  if (!match) return 0;
  const minutes = Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  return match[1] === '-' ? -minutes : minutes;
}

/** Convert a wall-clock calendar value in an IANA zone into an instant. */
export function zonedDateTimeToIso(date: string, time = '00:00', timeZone = browserTimeZone()) {
  const parsed = parseDateOnly(date);
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(time);
  if (!parsed || !timeMatch) throw new Error('Invalid local date or time.');
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] ?? 0);
  const millisecond = Number((timeMatch[4] ?? '').padEnd(3, '0') || 0);
  if (hour > 23 || minute > 59 || second > 59) throw new Error('Invalid local date or time.');

  const zone = resolveTimeZone(timeZone);
  const wallClockUtc = Date.UTC(parsed.year, parsed.month - 1, parsed.day, hour, minute, second, millisecond);
  let instant = wallClockUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const adjusted = wallClockUtc - timeZoneOffsetMinutes(new Date(instant), zone) * 60_000;
    if (adjusted === instant) break;
    instant = adjusted;
  }
  return new Date(instant).toISOString();
}

export function dateOnlyToLocalDate(value: string) {
  const parsed = parseDateOnly(value);
  if (!parsed) return null;
  return new Date(parsed.year, parsed.month - 1, parsed.day);
}

export interface ReportPeriodRange {
  start: string;
  end: string;
  label: string;
  key: string;
}

function isoDay(date: Date) { return date.toISOString().slice(0, 10); }
function plusDays(date: Date, days: number) { const next = new Date(date); next.setUTCDate(next.getUTCDate() + days); return next; }
function rangeLabel(start: Date, endExclusive: Date) { return `${formatDateOnly(isoDay(start), 'en-US')} - ${formatDateOnly(isoDay(plusDays(endExclusive, -1)), 'en-US')}`; }

export function reportRange(period: 'this-week' | 'this-month' | 'last-month' | 'this-year', now = new Date(), timeZone = browserTimeZone()): ReportPeriodRange {
  const todayParts = getLocalCalendarParts(now, timeZone);
  const today = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day));
  if (period === 'this-week') {
    const mondayOffset = (today.getUTCDay() + 6) % 7;
    const start = plusDays(today, -mondayOffset); const end = plusDays(start, 7);
    return { start: zonedDateTimeToIso(isoDay(start), '00:00:00', timeZone), end: zonedDateTimeToIso(isoDay(end), '00:00:00', timeZone), label: `This Week (${rangeLabel(start, end)})`, key: 'week' };
  }
  if (period === 'this-year') {
    const start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1)); const end = new Date(Date.UTC(today.getUTCFullYear() + 1, 0, 1));
    return { start: zonedDateTimeToIso(isoDay(start), '00:00:00', timeZone), end: zonedDateTimeToIso(isoDay(end), '00:00:00', timeZone), label: `This Year (${today.getUTCFullYear()})`, key: 'year' };
  }
  const monthOffset = period === 'last-month' ? -1 : 0;
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + monthOffset, 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { start: zonedDateTimeToIso(isoDay(start), '00:00:00', timeZone), end: zonedDateTimeToIso(isoDay(end), '00:00:00', timeZone), label: `${period === 'last-month' ? 'Last' : 'This'} Month (${formatMonthKey(isoDay(start).slice(0, 7))})`, key: 'month' };
}

export function customReportRange(startDay: string, endDay: string, timeZone = browserTimeZone()): ReportPeriodRange {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDay) || !/^\d{4}-\d{2}-\d{2}$/.test(endDay) || startDay > endDay) throw new Error('End date must be on or after the start date.');
  const start = new Date(`${startDay}T00:00:00.000Z`); const end = plusDays(new Date(`${endDay}T00:00:00.000Z`), 1);
  return { start: zonedDateTimeToIso(startDay, '00:00:00', timeZone), end: zonedDateTimeToIso(isoDay(end), '00:00:00', timeZone), label: `Custom Range (${rangeLabel(start, end)})`, key: 'custom' };
}
