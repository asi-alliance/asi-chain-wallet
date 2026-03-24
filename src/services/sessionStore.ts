import { Account } from 'types/wallet';
import { SESSION_STORAGE_KEYS, SessionPersistencePort, NullSessionPersistence } from './sessionPersistence';

type CryptoWithOptionalRandomUUID = Crypto & { randomUUID?: () => string };

// In-memory + sessionStorage session state; no private keys ever written to IDB
export class SessionStore {
  private static port: SessionPersistencePort = NullSessionPersistence;

  static setPort(port: SessionPersistencePort): void {
    this.port = port;
  }

  // --- Auth ---

  static setAuthenticated(value: boolean): void {
    if (value) {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.AUTH, 'true');
      this.updateLastActivity();
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEYS.AUTH);
    }
    this.port.persist();
  }

  static isAuthenticated(): boolean {
    return sessionStorage.getItem(SESSION_STORAGE_KEYS.AUTH) === 'true';
  }

  // --- User ID ---

  static setUserId(userId: string): void {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.USER_ID, userId);
    this.port.persist();
  }

  static getUserId(): string | null {
    return sessionStorage.getItem(SESSION_STORAGE_KEYS.USER_ID);
  }

  // --- Session token ---

  static generateToken(): string {
    const cryptoApi = globalThis.crypto as CryptoWithOptionalRandomUUID | undefined;
    if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
    if (cryptoApi?.getRandomValues) {
      const bytes = new Uint8Array(32);
      cryptoApi.getRandomValues(bytes);
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  static setToken(token: string): void {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.SESSION_TOKEN, token);
    this.port.persist();
  }

  static getToken(): string | null {
    return sessionStorage.getItem(SESSION_STORAGE_KEYS.SESSION_TOKEN);
  }

  static hasToken(): boolean {
    return !!this.getToken();
  }

  // --- Unlocked accounts (in-tab only; private keys stay in memory) ---

  static storeAccount(accountId: string, account: Account): void {
    const data = this.readAccounts();
    data[accountId] = account;
    sessionStorage.setItem(SESSION_STORAGE_KEYS.SESSION, JSON.stringify(data));
    this.port.persist();
  }

  static getAccount(accountId: string): Account | null {
    return this.readAccounts()[accountId] ?? null;
  }

  static getAllAccounts(): Account[] {
    return Object.values(this.readAccounts());
  }

  static removeAccount(accountId: string): void {
    const data = this.readAccounts();
    delete data[accountId];
    sessionStorage.setItem(SESSION_STORAGE_KEYS.SESSION, JSON.stringify(data));
    this.port.persist();
  }

  static updateAccountNetworks(updateMap: Map<string, string>): void {
    const data = this.readAccounts();
    let changed = false;
    updateMap.forEach((nextNetworkId, id) => {
      if (data[id] && data[id].networkId !== nextNetworkId) {
        data[id] = { ...data[id], networkId: nextNetworkId };
        changed = true;
      }
    });
    if (changed) sessionStorage.setItem(SESSION_STORAGE_KEYS.SESSION, JSON.stringify(data));
  }

  // --- Activity ---

  static updateLastActivity(): void {
    sessionStorage.setItem('lastActivity', Date.now().toString());
    this.port.persistThrottled();
  }

  static getLastActivity(): number {
    const ts = sessionStorage.getItem('lastActivity');
    return ts ? parseInt(ts, 10) : Date.now();
  }

  // --- Clear ---

  static clear(): void {
    this.port.remove();
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.AUTH);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.USER_ID);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.SESSION_TOKEN);
  }

  private static readAccounts(): Record<string, Account> {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEYS.SESSION);
      return raw ? (JSON.parse(raw) as Record<string, Account>) : {};
    } catch {
      return {};
    }
  }
}