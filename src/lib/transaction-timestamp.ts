/**
 * A manual entry captures a financial calendar date but has no separate time
 * control. Preserve that selected date while retaining the time it was
 * recorded, so same-day activity has a meaningful chronological order.
 */
export function occurredAtForTransactionDate(date: string, now = new Date()) {
  return `${date}T${now.toISOString().slice(11)}`;
}
