import { forwardRef, useLayoutEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { amountSeparators, caretPositionForDigits, evaluateAmountExpression, formatAmountInput, normalizeAmountInput } from '../../lib/amount-format';
import { Input } from './Input';

export interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  value: string | number;
  onValueChange: (canonicalValue: string) => void;
  locale?: string;
  numberFormat?: string;
  maximumFractionDigits?: number;
  error?: string;
  allowExpressions?: boolean;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(({
  value,
  onValueChange,
  locale = 'id-ID',
  numberFormat,
  maximumFractionDigits = 2,
  allowExpressions = true,
  error,
  onBlur,
  onKeyDown,
  ...props
}, forwardedRef) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<{ digits: number; afterDecimal: boolean } | null>(null);
  const [expressionDraft, setExpressionDraft] = useState<string | null>(null);
  const [expressionError, setExpressionError] = useState('');
  const preferences = { locale, numberFormat };
  const displayValue = expressionDraft ?? formatAmountInput(value, preferences, maximumFractionDigits);

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
    if (allowExpressions && /[+\-*/()]/.test(input)) {
      setExpressionDraft(input);
      setExpressionError('');
      return;
    }
    setExpressionDraft(null);
    setExpressionError('');
    const selection = event.target.selectionStart ?? input.length;
    const prefix = input.slice(0, selection);
    const { decimal } = amountSeparators(preferences);
    caretRef.current = { digits: (prefix.match(/\d/g) ?? []).length, afterDecimal: prefix.endsWith(decimal) };
    onValueChange(normalizeAmountInput(input, preferences, maximumFractionDigits));
  };

  const commitExpression = () => {
    if (expressionDraft === null) return true;
    const result = evaluateAmountExpression(expressionDraft, preferences, maximumFractionDigits);
    if (!result.ok) { setExpressionError(result.error); return false; }
    onValueChange(result.value);
    setExpressionDraft(null);
    setExpressionError('');
    return true;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && expressionDraft !== null) {
      event.preventDefault();
      commitExpression();
    }
    onKeyDown?.(event);
  };

  return <Input
    {...props}
    ref={inputRef}
    type="text"
    inputMode="decimal"
    value={displayValue}
    onChange={handleChange}
    onKeyDown={handleKeyDown}
    onBlur={(event) => { commitExpression(); onBlur?.(event); }}
    error={expressionError || error}
    title={allowExpressions ? 'You can enter a value or calculate with +, -, *, /, and parentheses.' : props.title}
  />;
});

AmountInput.displayName = 'AmountInput';
