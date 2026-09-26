type Base64Alphabet = 'base64' | 'base64url';

type Base64Options = {
  alphabet?: Base64Alphabet;
  omitPadding?: boolean;
};

type Uint8ArrayBase64Constructor = typeof Uint8Array & {
  fromBase64?: (value: string, options?: Base64Options) => Uint8Array;
};

type Uint8ArrayBase64Instance = Uint8Array & {
  toBase64?: (options?: Base64Options) => string;
};

function normalizedBase64(value: string) {
  const normalized = value.trim().replace(/-/g, '+').replace(/_/g, '/');
  if (normalized.length % 4 === 1) throw new Error('Invalid base64 input.');
  return normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
}

export function decodeBase64(value: string, _options?: Base64Options) {
  const binary = atob(normalizedBase64(value));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeBase64(value: Uint8Array, options: Base64Options = {}) {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);

  let encoded = btoa(binary);
  if (options.alphabet === 'base64url') {
    encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
  }
  if (options.omitPadding) encoded = encoded.replace(/=+$/g, '');
  return encoded;
}

export function installBase64Compatibility() {
  const constructor = Uint8Array as Uint8ArrayBase64Constructor;
  if (typeof constructor.fromBase64 !== 'function') {
    Object.defineProperty(constructor, 'fromBase64', {
      configurable: true,
      value: decodeBase64,
    });
  }

  const prototype = Uint8Array.prototype as Uint8ArrayBase64Instance;
  if (typeof prototype.toBase64 !== 'function') {
    Object.defineProperty(prototype, 'toBase64', {
      configurable: true,
      value(this: Uint8Array, options?: Base64Options) {
        return encodeBase64(this, options);
      },
    });
  }
}
