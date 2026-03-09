import { hashValue } from 'utils/encryption';
import { StorageProvider, StorageAdapter, SessionRecord } from './storage';

/**
 * Manages session durability in IndexedDB.
 *
 * Each browser tab holds a unique session token in sessionStorage.
 * SessionPersistence mirrors that data to IDB so a tab can recover
 * its session after a browser restart (session restore) and so stale
 * sessions are cleaned up automatically.
 *
 * Extracted from SecureStorage to keep account/settings persistence
 * and session persistence as separate concerns.
 */
export class SessionPersistence {
  private static readonly SESSION_KEY = hashValue('asi_wallet_session_v2');
  private static readonly AUTH_KEY = hashValue('asi_wallet_auth_v2');
  private static readonly USER_ID_KEY = hashValue('asi_wallet_user_id_v2');
  private static readonly SESSION_TOKEN_KEY = hashValue('asi_wallet_session_token_v2');

  /** Max age for stale session cleanup (24 hours). */
  private static readonly SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

  /** Throttle interval for activity-driven IDB writes (60 seconds). */
  private static readonly ACTIVITY_THROTTLE_MS = 60 * 1000;
  private static lastActivityPersistTime = 0;

  // ── Init-time operations ────────────────────────────────────────────

  /**
   * If this tab has a session token in sessionStorage, load its
   * session record from IDB back into sessionStorage.
   * Handles the case where sessionStorage lost data (e.g. browser restart
   * with session restore) but IDB still holds the session.
   */
  static async restore(adapter: StorageAdapter): Promise<void> {
    const token = sessionStorage.getItem(this.SESSION_TOKEN_KEY);
    if (!token) {
      return;
    }

    const record = await adapter.getSession(token);
    if (!record) {
      return;
    }

    if (!sessionStorage.getItem(this.AUTH_KEY) && record.isAuthenticated) {
      sessionStorage.setItem(this.AUTH_KEY, 'true');
    }
    if (!sessionStorage.getItem(this.USER_ID_KEY) && record.userId) {
      sessionStorage.setItem(this.USER_ID_KEY, record.userId);
    }
    if (!sessionStorage.getItem(this.SESSION_KEY) && record.unlockedAccounts) {
      sessionStorage.setItem(this.SESSION_KEY, record.unlockedAccounts);
    }
    if (!sessionStorage.getItem('lastActivity') && record.lastActivity) {
      sessionStorage.setItem('lastActivity', record.lastActivity.toString());
    }
  }

  /** Fire-and-forget cleanup of sessions older than SESSION_MAX_AGE_MS. */
  static cleanupStale(adapter: StorageAdapter): void {
    adapter.deleteSessionsOlderThan(this.SESSION_MAX_AGE_MS).catch(() => {
      // Non-critical; will retry on next init
    });
  }

  // ── Runtime persistence ─────────────────────────────────────────────

  /** Persist current session state to IDB under this tab's token. */
  static persist(): void {
    const adapter = StorageProvider.getAdapter();
    if (!adapter) {
      return;
    }

    const token = sessionStorage.getItem(this.SESSION_TOKEN_KEY);
    if (!token) {
      return;
    }

    const userId = sessionStorage.getItem(this.USER_ID_KEY) ?? '';
    const isAuthenticated = sessionStorage.getItem(this.AUTH_KEY) === 'true';
    const lastActivityStr = sessionStorage.getItem('lastActivity');
    const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : Date.now();
    const unlockedAccounts = sessionStorage.getItem(this.SESSION_KEY) ?? '{}';

    const record: SessionRecord = {
      token,
      userId,
      isAuthenticated,
      lastActivity,
      unlockedAccounts,
      updatedAt: Date.now(),
    };

    adapter.putSession(record).catch((err: unknown) => {
      console.error('[SessionPersistence] Failed to persist session to IDB:', err);
    });
  }

  /**
   * Throttled persist — used by updateLastActivity which fires on every
   * user interaction. Writes to IDB at most once per ACTIVITY_THROTTLE_MS.
   */
  static persistThrottled(): void {
    const now = Date.now();
    if (now - this.lastActivityPersistTime < this.ACTIVITY_THROTTLE_MS) {
      return;
    }
    this.lastActivityPersistTime = now;
    this.persist();
  }

  /** Remove this tab's session record from IDB. */
  static remove(): void {
    const adapter = StorageProvider.getAdapter();
    if (!adapter) {
      return;
    }

    const token = sessionStorage.getItem(this.SESSION_TOKEN_KEY);
    if (!token) {
      return;
    }

    adapter.deleteSession(token).catch((err: unknown) => {
      console.error('[SessionPersistence] Failed to delete session from IDB:', err);
    });
  }
}