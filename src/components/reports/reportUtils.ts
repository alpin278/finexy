export const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

export const formatCompactUsd = (value: number) =>
  `$${(value / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
