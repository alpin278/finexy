import { decodeBase64, encodeBase64 } from './base64-compat.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertBytes(actual: Uint8Array, expected: number[], label: string) {
  assert(actual.length === expected.length, `${label}: unexpected length`);
  expected.forEach((value, index) => assert(actual[index] === value, `${label}: byte ${index} differs`));
}

Deno.test('base64 compatibility handles standard, URL-safe, binary, empty, and padding inputs', () => {
  assertBytes(decodeBase64('SGVsbG8='), [72, 101, 108, 108, 111], 'standard base64');
  assertBytes(decodeBase64('SGVsbG8'), [72, 101, 108, 108, 111], 'unpadded base64');
  assertBytes(decodeBase64('_wAB'), [255, 0, 1], 'base64url binary');
  assertBytes(decodeBase64(''), [], 'empty base64');

  const binary = Uint8Array.from([0, 127, 128, 255]);
  assert(encodeBase64(binary) === 'AH+A/w==', 'standard encoding differs');
  assert(encodeBase64(binary, { alphabet: 'base64url', omitPadding: true }) === 'AH-A_w', 'URL-safe encoding differs');
  assertBytes(decodeBase64(encodeBase64(binary, { alphabet: 'base64url', omitPadding: true })), [0, 127, 128, 255], 'round trip');
});
