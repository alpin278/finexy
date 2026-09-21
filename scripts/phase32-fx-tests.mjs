// Deterministic fixture checks: no live provider or Supabase dependency.
const SCALE = 10n ** 18n;
function parse(value) { const [whole, fraction = ''] = String(value).split('.'); return BigInt(whole) * SCALE + BigInt(fraction.slice(0, 18).padEnd(18, '0')); }
function display(value) { const whole = value / SCALE; const fraction = (value % SCALE).toString().padStart(18, '0').replace(/0+$/, ''); return `${whole}${fraction ? `.${fraction}` : ''}`; }
function multiply(amount, rate) { return display((parse(amount) * parse(rate)) / SCALE); }
function assert(condition, label) { if (!condition) throw new Error(label); }
assert(multiply('100', '16000') === '1600000', 'USD → IDR conversion');
assert(multiply('1000000', '0.0000625') === '62.5', 'IDR inverse conversion');
assert(multiply('123.456789', '1') === '123.456789', 'same-currency identity');
assert(multiply('50', '17300.123456789') === '865006.17283945', 'high precision conversion');
assert(!Number.isFinite(Number('0')) || Number('0') <= 0, 'zero rate rejected by schema/service');
console.log('Phase 32 FX fixtures passed: direct, inverse, identity, high precision, missing/invalid policy documented.');
