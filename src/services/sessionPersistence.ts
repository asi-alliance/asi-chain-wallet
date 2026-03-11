import { hashValue } from 'utils/encryption';
import { StorageAdapter, SessionRecord } from './storage';

export const SESSION_STORAGE_KEYS = {
  SESSION:       hashValue('asi_wallet_session_v2'),
  AUTH:          hashValue('asi_wallet_auth_v2'),
  USER_ID:       hashValue('asi_wallet_user_id_v2'),
  SESSION_TOKEN: hashValue('asi_wallet_session_token_v2'),
} as const;

export interface SessionPersistencePort {
  persist(): void;
  persistThrottled(): void;
  remove(): void;
}

export const NullSessionPersistence: SessionPersistencePort = {
  persist() { /* no-op */ },
  persistThrottled() { /* no-op */ },
  remove() { /* no-op */ },
};

/**
 * Manages session durability in IndexedDB.
 */
export class SessionPersistence implements SessionPersistencePort {

  static readonly SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
  static readonly ACTIVITY_THROTTLE_MS = 60 * 1000;

  private static _instance: SessionPersistence | null = null;

  static init(adapter: StorageAdapter | null): SessionPersistence {
    SessionPersistence._instance = new SessionPersistence(adapter);
    return SessionPersistence._instance;
  }

  static getInstance(): SessionPersistence | null {
    return SessionPersistence._instance;
  }

  private readonly adapter: StorageAdapter | null;

  private lastActivityPersistTime = 0;

  private constructor(adapter: StorageAdapter | null) {
    this.adapter = adapter;
  }

  static async restore(adapter: StorageAdapter): Promise<void> {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEYS.SESSION_TOKEN);
    if (!token) return;

    const record = await adapter.getSession(token);
    if (!record) return;

    if (!sessionStorage.getItem(SESSION_STORAGE_KEYS.AUTH) && record.isAuthenticated) {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.AUTH, 'true');
    }
    if (!sessionStorage.getItem(SESSION_STORAGE_KEYS.USER_ID) && record.userId) {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.USER_ID, record.userId);
    }
    if (!sessionStorage.getItem(SESSION_STORAGE_KEYS.SESSION) && record.unlockedAccounts) {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.SESSION, record.unlockedAccounts);
    }
    if (!sessionStorage.getItem('lastActivity') && record.lastActivity) {
      sessionStorage.setItem('lastActivity', record.lastActivity.toString());
    }
  }

  static cleanupStale(adapter: StorageAdapter): void {
    adapter.deleteSessionsOlderThan(SessionPersistence.SESSION_MAX_AGE_MS).catch(() => {
      // Non-critical; will retry on next init
    });
  }

  persist(): void {
    if (!this.adapter) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEYS.SESSION_TOKEN);
    if (!token) return;

    const userId           = sessionStorage.getItem(SESSION_STORAGE_KEYS.USER_ID) ?? '';
    const isAuthenticated  = sessionStorage.getItem(SESSION_STORAGE_KEYS.AUTH) === 'true';
    const lastActivityStr  = sessionStorage.getItem('lastActivity');
    const lastActivity     = lastActivityStr ? parseInt(lastActivityStr, 10) : Date.now();
    const unlockedAccounts = sessionStorage.getItem(SESSION_STORAGE_KEYS.SESSION) ?? '{}';

    const record: SessionRecord = {
      token,
      userId,
      isAuthenticated,
      lastActivity,
      unlockedAccounts,
      updatedAt: Date.now(),
    };

    this.adapter.putSession(record).catch((err: unknown) => {
      console.error('[SessionPersistence] Failed to persist session to IDB:', err);
    });
  }

  persistThrottled(): void {
    const now = Date.now();
    if (now - this.lastActivityPersistTime < SessionPersistence.ACTIVITY_THROTTLE_MS) {
      return;
    }
    this.lastActivityPersistTime = now;
    this.persist();
  }

  remove(): void {
    if (!this.adapter) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEYS.SESSION_TOKEN);
    if (!token) return;

    this.adapter.deleteSession(token).catch((err: unknown) => {
      console.error('[SessionPersistence] Failed to delete session from IDB:', err);
    });
  }
}