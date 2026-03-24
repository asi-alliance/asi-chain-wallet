import { deriveKey, encryptData, decryptData, DecryptionError, AesKeyLength } from './webCrypto';

// ---------------------------------------------------------------------------
// Constants — iter is stored in every V2 payload so bumping this is safe
// ---------------------------------------------------------------------------

export const V2_SALT_BYTES = 16;
export const V2_IV_BYTES = 12;
export const V2_TAG_BYTES = 16;
export const V2_KEY_LENGTH: AesKeyLength = AesKeyLength.Aes256;

// Increase as device performance allows; stored per-payload so safe to change
export const V2_PBKDF2_ITERATIONS = 310_000;

// Fallback for V2 payloads created before iter was stored in the payload
const V2_LEGACY_PBKDF2_ITERATIONS = 100_000;

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
  readonly iter: number; // PBKDF2 iterations stored in payload
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function toBase64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));
}

function fromBase64(encoded: string): Uint8Array {
  const binary = atob(encoded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function copyToArrayBuffer(src: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(src.byteLength);
  new Uint8Array(buf).set(src);
  return buf;
}

function splitCiphertextAndTag(combined: ArrayBuffer): { ciphertext: Uint8Array; tag: Uint8Array } {
  const all = new Uint8Array(combined);
  const tagStart = all.byteLength - V2_TAG_BYTES;
  return { ciphertext: all.slice(0, tagStart), tag: all.slice(tagStart) };
}

function joinCiphertextAndTag(ciphertext: Uint8Array, tag: Uint8Array): ArrayBuffer {
  const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.byteLength);
  return copyToArrayBuffer(combined);
}

function isV2Json(value: string): boolean {
  if (!value.startsWith('{')) return false;
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

function parseAndValidate(sealed: string): EncryptedPayloadV2 {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(sealed) as Record<string, unknown>;
  } catch {
    throw new DecryptionError('Invalid payload: not valid JSON');
  }

  if (raw['v'] !== PayloadVersion.V2) throw new DecryptionError('Invalid payload: unsupported version');

  if (
    typeof raw['salt'] !== 'string' ||
    typeof raw['iv'] !== 'string' ||
    typeof raw['tag'] !== 'string' ||
    typeof raw['ct'] !== 'string'
  ) {
    throw new DecryptionError('Invalid payload: missing required fields');
  }

  return raw as unknown as EncryptedPayloadV2;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function detectVersion(sealed: string): PayloadVersion {
  return isV2Json(sealed) ? PayloadVersion.V2 : PayloadVersion.V1;
}

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
    iter: V2_PBKDF2_ITERATIONS,
  };

  return JSON.stringify(payload);
}

export async function openV2(sealed: string, password: string): Promise<string> {
  const parsed = parseAndValidate(sealed);

  let salt: Uint8Array;
  let iv: Uint8Array;
  let tag: Uint8Array;
  let ct: Uint8Array;

  try {
    salt = fromBase64(parsed.salt);
    iv = fromBase64(parsed.iv);
    tag = fromBase64(parsed.tag);
    ct = fromBase64(parsed.ct);
  } catch {
    throw new DecryptionError('Invalid payload: malformed base64 data');
  }

  // Use iter from payload; fall back to legacy 100k for payloads created before iter was added
  const hasStoredIter = typeof parsed.iter === 'number' && parsed.iter > 0;
  const iterations = hasStoredIter ? parsed.iter : V2_LEGACY_PBKDF2_ITERATIONS;

  const key = await deriveKey(password, salt, {
    iterations,
    keyLength: V2_KEY_LENGTH,
  });

  const combinedBuf = joinCiphertextAndTag(ct, tag);
  return decryptData(combinedBuf, key, iv);
}