/** Stable chart scales: monetary magnitude changes the domain, never layout. */
export function niceCeiling(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function positiveChartDomain(values: number[]) {
  return [0, niceCeiling(Math.max(0, ...values) * 1.08)] as const;
}

export function signedChartDomain(values: number[]) {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const bound = niceCeiling(Math.max(Math.abs(min), Math.abs(max)) * 1.08);
  return min < 0 ? ([-bound, bound] as const) : ([0, bound] as const);
}
