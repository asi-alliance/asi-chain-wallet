/**
 * AS-525 – Web Crypto helpers (browser-native, no third-party deps).
 */

// ---------------------------------------------------------------------------
// Constants & Enums
// ---------------------------------------------------------------------------

export enum AesKeyLength {
  Aes128 = 128,
  Aes192 = 192,
  Aes256 = 256,
}

const DEFAULT_IV_BYTE_LENGTH = 12;
const DEFAULT_ITERATIONS = 100_000;
const DEFAULT_KEY_LENGTH: AesKeyLength = AesKeyLength.Aes256;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeriveKeyOptions {
  iterations?: number;
  keyLength?: AesKeyLength;
}

export interface EncryptedPayload {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
}

export interface EncryptOptions {
  iv?: Uint8Array;
}

export class DecryptionError extends Error {
  constructor(message = 'Decryption failed: wrong key or tampered data') {
    super(message);
    this.name = 'DecryptionError';
  }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function getSubtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API is not available in this environment');
  }
  return subtle;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** PBKDF2 + SHA-256 → AES-GCM CryptoKey. */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  options?: DeriveKeyOptions,
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const iterations = options?.iterations ?? DEFAULT_ITERATIONS;
  const keyLength = options?.keyLength ?? DEFAULT_KEY_LENGTH;

  const passwordBytes = new TextEncoder().encode(password);

  const baseKey = await subtle.importKey(
    'raw',
    passwordBytes.buffer as ArrayBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: keyLength },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** AES-GCM encrypt; generates a random 12-byte IV when none is provided. */
export async function encryptData(
  plaintext: string,
  key: CryptoKey,
  options?: EncryptOptions,
): Promise<EncryptedPayload> {
  const subtle = getSubtleCrypto();

  const iv =
    options?.iv ?? globalThis.crypto.getRandomValues(new Uint8Array(DEFAULT_IV_BYTE_LENGTH));

  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encoded.buffer as ArrayBuffer,
  );

  return { ciphertext, iv };
}

/** AES-GCM decrypt → UTF-8 string. Throws DecryptionError on any failure. */
export async function decryptData(
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array,
): Promise<string> {
  const subtle = getSubtleCrypto();

  try {
    const decrypted = await subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new DecryptionError();
  }
}