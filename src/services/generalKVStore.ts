import { hashValue } from 'utils/encryption';
import { StorageProvider } from './storage';

// IDB-first key/value store with localStorage fallback
export class GeneralKVStore {
  static async set(key: string, value: string): Promise<void> {
    const hashed = hashValue(key);
    const adapter = StorageProvider.getAdapter();
    if (adapter) {
      await adapter.setItem(hashed, value);
      return;
    }
    localStorage.setItem(hashed, value);
  }

  static async get(key: string): Promise<string | null> {
    const hashed = hashValue(key);
    const adapter = StorageProvider.getAdapter();
    if (adapter) {
      const val = await adapter.getItem(hashed);
      if (val !== null) return val;
      return localStorage.getItem(hashed);
    }
    return localStorage.getItem(hashed);
  }

  static async remove(key: string): Promise<void> {
    const hashed = hashValue(key);
    const adapter = StorageProvider.getAdapter();
    if (adapter) await adapter.removeItem(hashed);
    localStorage.removeItem(hashed);
  }
}