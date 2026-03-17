import CryptoJS from 'crypto-js';

// Legacy V1 CryptoJS AES — read-only path; do not use for new data
export function legacyDecrypt(encrypted: string, password: string): string | undefined {
  if (!encrypted || !password) return undefined;
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, password);
    return decrypted.toString(CryptoJS.enc.Utf8) || undefined;
  } catch {
    return undefined;
  }
}

// Legacy CryptoJS SHA256 — only for verifying old V1 backup checksums
export function legacySha256(value: string): string {
  return CryptoJS.SHA256(value).toString();
}