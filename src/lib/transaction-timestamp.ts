/**
 * A manual entry captures a financial calendar date but has no separate time
 * control. Preserve that selected date while retaining the time it was
 * recorded, so same-day activity has a meaningful chronological order.
 */
export function occurredAtForTransactionDate(date: string, now = new Date()) {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return now.toISOString();
  const target = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return target.toISOString();
}
