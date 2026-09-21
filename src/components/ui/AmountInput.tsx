import { forwardRef, useLayoutEffect, useRef, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { amountSeparators, caretPositionForDigits, formatAmountInput, normalizeAmountInput } from '../../lib/amount-format';
import { Input } from './Input';

export interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  value: string | number;
  onValueChange: (canonicalValue: string) => void;
  locale?: string;
  numberFormat?: string;
  maximumFractionDigits?: number;
  error?: string;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(({
  value,
  onValueChange,
  locale = 'id-ID',
  numberFormat,
  maximumFractionDigits = 2,
  ...props
}, forwardedRef) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<{ digits: number; afterDecimal: boolean } | null>(null);
  const preferences = { locale, numberFormat };
  const displayValue = formatAmountInput(value, preferences, maximumFractionDigits);

  useLayoutEffect(() => {
    if (typeof forwardedRef === 'function') forwardedRef(inputRef.current);
    else if (forwardedRef) forwardedRef.current = inputRef.current;
  }, [forwardedRef]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const caret = caretRef.current;
    if (!input || !caret || document.activeElement !== input) return;
    const position = caretPositionForDigits(displayValue, caret.digits, caret.afterDecimal);
    input.setSelectionRange(position, position);
    caretRef.current = null;
  }, [displayValue]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    const selection = event.target.selectionStart ?? input.length;
    const prefix = input.slice(0, selection);
    const { decimal } = amountSeparators(preferences);
    caretRef.current = { digits: (prefix.match(/\d/g) ?? []).length, afterDecimal: prefix.endsWith(decimal) };
    onValueChange(normalizeAmountInput(input, preferences, maximumFractionDigits));
  };

  return <Input
    {...props}
    ref={inputRef}
    type="text"
    inputMode="decimal"
    value={displayValue}
    onChange={handleChange}
  />;
});

AmountInput.displayName = 'AmountInput';
