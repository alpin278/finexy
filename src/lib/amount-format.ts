export interface AmountFormatPreferences {
  locale: string;
  numberFormat?: string;
}

interface AmountSeparators {
  group: string;
  decimal: string;
}

export function amountSeparators({ locale, numberFormat }: AmountFormatPreferences): AmountSeparators {
  if (numberFormat === '1.234,56') return { group: '.', decimal: ',' };
  if (numberFormat === '1 234,56') return { group: ' ', decimal: ',' };
  if (numberFormat === '1,234.56') return { group: ',', decimal: '.' };
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  return {
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
  };
}

export function normalizeAmountInput(input: string, preferences: AmountFormatPreferences, maximumFractionDigits = 2) {
  if (!input.trim()) return '';
  const { decimal } = amountSeparators(preferences);
  const normalized = input.replace(/[\s\u00A0\u202F]/g, '');
  const decimalIndex = normalized.indexOf(decimal);
  const wholeSource = decimalIndex >= 0 ? normalized.slice(0, decimalIndex) : normalized;
  const fractionSource = decimalIndex >= 0 ? normalized.slice(decimalIndex + decimal.length) : '';
  const wholeDigits = wholeSource.replace(/\D/g, '');
  const fractionDigits = fractionSource.replace(/\D/g, '').slice(0, maximumFractionDigits);
  if (!wholeDigits && decimalIndex < 0) return '';
  const whole = (wholeDigits || '0').replace(/^0+(?=\d)/, '');
  if (decimalIndex < 0 || maximumFractionDigits === 0) return whole;
  return `${whole}.${fractionDigits}`;
}

export function formatAmountInput(value: string | number, preferences: AmountFormatPreferences, maximumFractionDigits = 2) {
  const canonical = String(value ?? '');
  if (!canonical) return '';
  const { group, decimal } = amountSeparators(preferences);
  const [rawWhole = '', rawFraction] = canonical.split('.');
  const wholeDigits = rawWhole.replace(/\D/g, '') || '0';
  const whole = wholeDigits.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  if (rawFraction === undefined || maximumFractionDigits === 0) return whole;
  return `${whole}${decimal}${rawFraction.replace(/\D/g, '').slice(0, maximumFractionDigits)}`;
}

export function parseAmountNumber(value: string | number) {
  const canonical = String(value ?? '').trim();
  if (!/^\d+(?:\.\d*)?$/.test(canonical)) return null;
  const numeric = Number(canonical);
  return Number.isFinite(numeric) ? numeric : null;
}

export function caretPositionForDigits(formatted: string, digitCount: number, afterDecimal = false) {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index])) seen += 1;
    if (seen === digitCount) {
      const next = index + 1;
      return afterDecimal ? Math.min(formatted.length, next + 1) : next;
    }
  }
  return formatted.length;
}
