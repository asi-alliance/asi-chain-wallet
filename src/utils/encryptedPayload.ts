import { deriveKey, encryptData, decryptData, DecryptionError, AesKeyLength } from './webCrypto';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const V2_SALT_BYTES = 16;
export const V2_IV_BYTES = 12;
export const V2_TAG_BYTES = 16;
export const V2_KEY_LENGTH: AesKeyLength = AesKeyLength.Aes256;
export const V2_PBKDF2_ITERATIONS = 100_000;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum PayloadVersion {
  V1 = 1,
  V2 = 2,
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EncryptedPayloadV2 {
  readonly v: PayloadVersion.V2;
  readonly salt: string;
  readonly iv: string;
  readonly tag: string;
  readonly ct: string;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function copyToArrayBuffer(src: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(src.byteLength);
  new Uint8Array(buf).set(src);
  return buf;
}

/** Split Web Crypto combined output into (ciphertext, 16-byte tag). */
function splitCiphertextAndTag(
  combined: ArrayBuffer,
): { ciphertext: Uint8Array; tag: Uint8Array } {
  const all = new Uint8Array(combined);
  const tagStart = all.byteLength - V2_TAG_BYTES;
  return {
    ciphertext: all.slice(0, tagStart),
    tag: all.slice(tagStart),
  };
}

/** Re-combine ciphertext + tag for Web Crypto decrypt. */
function joinCiphertextAndTag(
  ciphertext: Uint8Array,
  tag: Uint8Array,
): ArrayBuffer {
  const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.byteLength);
  return copyToArrayBuffer(combined);
}

function isV2Json(value: string): boolean {
  if (!value.startsWith('{')) {
    return false;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'v' in parsed &&
      (parsed as Record<string, unknown>)['v'] === PayloadVersion.V2
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Detect V1 (legacy CryptoJS) vs V2 (Web Crypto JSON). */
export function detectVersion(sealed: string): PayloadVersion {
  return isV2Json(sealed) ? PayloadVersion.V2 : PayloadVersion.V1;
}

/** Encrypt plaintext → V2 JSON string for storage. */
export async function sealV2(plaintext: string, password: string): Promise<string> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(V2_SALT_BYTES));

  const key = await deriveKey(password, salt, {
    iterations: V2_PBKDF2_ITERATIONS,
    keyLength: V2_KEY_LENGTH,
  });

  const { ciphertext: combined, iv } = await encryptData(plaintext, key);
  const { ciphertext, tag } = splitCiphertextAndTag(combined);

  const payload: EncryptedPayloadV2 = {
    v: PayloadVersion.V2,
    salt: toBase64(salt),
    iv: toBase64(iv),
    tag: toBase64(tag),
    ct: toBase64(ciphertext),
  };

  return JSON.stringify(payload);
}

/** Decrypt a V2 JSON string → plaintext. Throws DecryptionError on failure. */
export async function openV2(sealed: string, password: string): Promise<string> {
  let parsed: EncryptedPayloadV2;

  try {
    parsed = JSON.parse(sealed) as EncryptedPayloadV2;
  } catch {
    throw new DecryptionError('Invalid payload: not valid JSON');
  }

  if (parsed.v !== PayloadVersion.V2) {
    throw new DecryptionError('Invalid payload: unsupported version');
  }

  const salt = fromBase64(parsed.salt);
  const iv = fromBase64(parsed.iv);
  const tag = fromBase64(parsed.tag);
  const ct = fromBase64(parsed.ct);

  const key = await deriveKey(password, salt, {
    iterations: V2_PBKDF2_ITERATIONS,
    keyLength: V2_KEY_LENGTH,
  });

  const combined = joinCiphertextAndTag(ct, tag);

  return decryptData(combined, key, iv);
}