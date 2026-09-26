import { browserTimeZone, getLocalCalendarParts, getLocalDateKey, zonedDateTimeToIso } from './date-time';

/**
 * A manual entry captures a financial calendar date but has no separate time
 * control. Preserve that selected date while retaining the time it was
 * recorded, so same-day activity has a meaningful chronological order.
 */
export function occurredAtForTransactionDate(date: string, now = new Date(), timeZone = browserTimeZone()) {
  const parts = getLocalCalendarParts(now, timeZone);
  if (!/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(date)) return now.toISOString();
  return zonedDateTimeToIso(date, `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}.${String(parts.millisecond).padStart(3, '0')}`, timeZone);
}

/**
 * When updating an existing transaction, retain its exact occurred_at instant
 * if the date is unchanged, or preserve the local time component if the date was edited.
 */
export function resolveOccurredAt(date: string, existingOccurredAt?: string, now = new Date(), timeZone = browserTimeZone()) {
  if (existingOccurredAt) {
    const existingDate = getLocalDateKey(existingOccurredAt, timeZone);
    if (existingDate === date) {
      return existingOccurredAt;
    }
    const parts = getLocalCalendarParts(existingOccurredAt, timeZone);
    const time = `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}.${String(parts.millisecond).padStart(3, '0')}`;
    return zonedDateTimeToIso(date, time, timeZone);
  }
  return occurredAtForTransactionDate(date, now, timeZone);
}
