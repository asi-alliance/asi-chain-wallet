import { decrypt, hashValue } from 'utils/encryption';
import { sealV2, openV2, detectVersion, PayloadVersion } from 'utils/encryptedPayload';
import { Account } from 'types/wallet';
import { StorageProvider, StoredAccountRecord, StorageAdapter } from './storage';
import {
  SessionPersistence,
  SessionPersistencePort,
  NullSessionPersistence,
  SESSION_STORAGE_KEYS,
} from './sessionPersistence';

export interface SecureAccount extends Omit<Account, 'privateKey'> {
  encryptedPrivateKey?: string;
  privateKey?: never;
  derivationPath?: string;
  isHardwareWallet?: boolean;
  userId?: string;
}

export interface SecureStorageData {
  accounts: SecureAccount[];
  settings: {
    requirePasswordForTransaction: boolean;
    idleTimeout: number;
  };
}

type CryptoWithOptionalRandomUUID = Crypto & {
  randomUUID?: () => string;
};

function toStoredRecord(account: SecureAccount): StoredAccountRecord {
  return {
    id: account.id,
    name: account.name,
    address: account.address,
    revAddress: account.revAddress,
    ethAddress: account.ethAddress,
    publicKey: account.publicKey,
    encryptedPrivateKey: account.encryptedPrivateKey,
    balance: account.balance,
    isMetamask: account.isMetamask,
    networkId: account.networkId,
    userId: account.userId,
    derivationPath: account.derivationPath,
    isHardwareWallet: account.isHardwareWallet,
    createdAt: account.createdAt instanceof Date
      ? account.createdAt.toISOString()
      : String(account.createdAt ?? new Date().toISOString()),
  };
}

function fromStoredRecord(record: StoredAccountRecord): SecureAccount {
  return {
    id: record.id,
    name: record.name,
    address: record.address,
    revAddress: record.revAddress,
    ethAddress: record.ethAddress,
    publicKey: record.publicKey,
    encryptedPrivateKey: record.encryptedPrivateKey,
    balance: record.balance,
    isMetamask: record.isMetamask,
    networkId: record.networkId,
    userId: record.userId,
    derivationPath: record.derivationPath,
    isHardwareWallet: record.isHardwareWallet,
    createdAt: new Date(record.createdAt),
  };
}

const DEFAULT_SETTINGS: SecureStorageData['settings'] = {
  requirePasswordForTransaction: false,
  idleTimeout: 15,
};

export class SecureStorage {
  private static readonly STORAGE_KEY = hashValue('asi_wallet_secure_v2');

  private static readonly SESSION_KEY       = SESSION_STORAGE_KEYS.SESSION;
  private static readonly AUTH_KEY          = SESSION_STORAGE_KEYS.AUTH;
  private static readonly USER_ID_KEY       = SESSION_STORAGE_KEYS.USER_ID;
  private static readonly SESSION_TOKEN_KEY = SESSION_STORAGE_KEYS.SESSION_TOKEN;

  private static sessionPort: SessionPersistencePort = NullSessionPersistence;

  private static cache: SecureStorageData = SecureStorage.readLocalStorage();
  private static initialized = false;
  private static initPromise: Promise<void> | null = null;

  static async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.performInit();
    return this.initPromise;
  }

  private static async performInit(): Promise<void> {
    try {
      await StorageProvider.init();
      const adapter = StorageProvider.getAdapter();
      if (!adapter) {
        this.initialized = true;
        return;
      }

      this.sessionPort = SessionPersistence.init(adapter);

      await this.migrateFromLocalStorage(adapter);
      await this.loadCacheFromIDB(adapter);
      await SessionPersistence.restore(adapter);
      SessionPersistence.cleanupStale(adapter);
      this.initialized = true;
    } catch (error) {
      console.error('[SecureStorage] init failed, falling back to localStorage cache:', error);
      this.initialized = true;
    }
  }

  private static async migrateFromLocalStorage(adapter: StorageAdapter): Promise<void> {
    const existingAccounts = await adapter.getAllAccounts();
    if (existingAccounts.length > 0) {
      return;
    }

    const lsData = this.readLocalStorage();
    if (lsData.accounts.length === 0) {
      return;
    }

    const records = lsData.accounts.map(toStoredRecord);
    await adapter.putAccounts(records);
    await adapter.putSettings({
      id: 'default',
      ...lsData.settings,
    });

    console.info('[SecureStorage] Migrated localStorage data to IndexedDB');
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private static async loadCacheFromIDB(adapter: StorageAdapter): Promise<void> {
    const [records, settingsRecord] = await Promise.all([
      adapter.getAllAccounts(),
      adapter.getSettings(),
    ]);

    const accounts = records.map(fromStoredRecord);
    const settings: SecureStorageData['settings'] = settingsRecord
      ? {
          requirePasswordForTransaction: settingsRecord.requirePasswordForTransaction,
          idleTimeout: settingsRecord.idleTimeout,
        }
      : { ...DEFAULT_SETTINGS };

    this.cache = { accounts, settings };
  }

  private static readLocalStorage(): SecureStorageData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as SecureStorageData;
      }
    } catch (error) {
      console.error('Failed to parse storage data:', error);
    }
    return { accounts: [], settings: { ...DEFAULT_SETTINGS } };
  }

  private static persistAccounts(): void {
    const adapter = StorageProvider.getAdapter();
    if (!adapter) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
      return;
    }

    const records = this.cache.accounts.map(toStoredRecord);
    adapter.putAccounts(records).catch((err: unknown) => {
      console.error('[SecureStorage] Failed to persist accounts to IDB:', err);
    });
  }

  private static persistSettings(): void {
    const adapter = StorageProvider.getAdapter();
    if (!adapter) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
      return;
    }

    adapter
      .putSettings({ id: 'default', ...this.cache.settings })
      .catch((err: unknown) => {
        console.error('[SecureStorage] Failed to persist settings to IDB:', err);
      });
  }

  /**
   * Explicitly await pending IDB writes for critical operations
   * where fire-and-forget is not acceptable.
   */
  static async flush(): Promise<void> {
    const adapter = StorageProvider.getAdapter();
    if (!adapter) {
      return;
    }

    const records = this.cache.accounts.map(toStoredRecord);
    await adapter.putAccounts(records);
    await adapter.putSettings({ id: 'default', ...this.cache.settings });
  }

  static saveEncryptedAccounts(accounts: SecureAccount[]): void {
    try {
      this.cache.accounts = accounts;
      this.persistAccounts();
    } catch (error) {
      console.error('Failed to save encrypted accounts:', error);
      throw new Error('Failed to save accounts');
    }
  }

  static getEncryptedAccounts(userId?: string): SecureAccount[] {
    try {
      const accounts = this.cache.accounts;
      if (userId) {
        return accounts.filter(account => account.userId === userId);
      }
      return accounts;
    } catch (error) {
      console.error('Failed to get encrypted accounts:', error);
      return [];
    }
  }

  static async saveAccount(account: Account, password: string, userId?: string, profileName?: string): Promise<SecureAccount> {
    if (!account.privateKey) {
      throw new Error('Private key is required');
    }

    let currentUserId = userId;
    if (!currentUserId) {
      const nameToUse = profileName ?? account.name;
      if (!nameToUse) {
        throw new Error('Account name is required to generate user ID');
      }
      currentUserId = this.generateUserIdFromPassword(password, nameToUse);
    }

    const encryptedPrivateKey = await sealV2(account.privateKey, password);
    const { privateKey, ...accountWithoutKey } = account;
    const secureAccount: SecureAccount = {
      ...accountWithoutKey,
      encryptedPrivateKey,
      userId: currentUserId,
    };

    const allAccounts = this.getEncryptedAccounts();
    const existingIndex = allAccounts.findIndex(a => a.id === account.id);

    if (existingIndex >= 0) {
      allAccounts[existingIndex] = secureAccount;
    } else {
      allAccounts.push(secureAccount);
    }

    this.saveEncryptedAccounts(allAccounts);
    await this.flush();
    return secureAccount;
  }

  static async unlockAccount(accountId: string, password: string, userId?: string): Promise<Account | null> {
    const currentUserId = userId ?? this.getCurrentUserId();
    if (!currentUserId) {
      return null;
    }

    const allAccounts = this.getEncryptedAccounts();
    const secureAccount = allAccounts.find(a => a.id === accountId);

    if (!secureAccount?.encryptedPrivateKey) {
      return null;
    }

    if (!this.validateAccountOwnership(secureAccount, password, currentUserId)) {
      return null;
    }

    const version = detectVersion(secureAccount.encryptedPrivateKey);
    const privateKey = await this.decryptPrivateKey(secureAccount.encryptedPrivateKey, password, version);
    if (!privateKey) {
      return null;
    }

    // Lazy V1 → V2 migration (fire-and-forget)
    if (version === PayloadVersion.V1) {
      this.reEncryptToV2(secureAccount.id, privateKey, password);
    }

    const { encryptedPrivateKey, userId: _, ...accountData } = secureAccount;
    const account: Account = {
      ...accountData,
      privateKey
    };

    this.storeInSession(accountId, account);
    return account;
  }

  /** Validate that the account belongs to the current user. */
  private static validateAccountOwnership(
    secureAccount: SecureAccount,
    password: string,
    currentUserId: string,
  ): boolean {
    if (secureAccount.userId) {
      if (secureAccount.userId !== currentUserId) return false;
      if (!secureAccount.name) return true;
      return this.generateUserIdFromPassword(password, secureAccount.name) === secureAccount.userId;
    }
    if (!secureAccount.name) return true;
    return this.generateUserIdFromPassword(password, secureAccount.name) === currentUserId;
  }

  /** Decrypt with V2 (Web Crypto) or V1 (legacy CryptoJS) based on version. */
  private static async decryptPrivateKey(
    encrypted: string,
    password: string,
    version: PayloadVersion,
  ): Promise<string | undefined> {
    if (version === PayloadVersion.V2) {
      try {
        return await openV2(encrypted, password);
      } catch {
        return undefined;
      }
    }
    return decrypt(encrypted, password);
  }

  /** Re-encrypt a V1 payload to V2 format. Fire-and-forget; silent on failure. */
  private static reEncryptToV2(accountId: string, privateKey: string, password: string): void {
    sealV2(privateKey, password)
      .then(encrypted => {
        const accounts = this.getEncryptedAccounts();
        const updated = accounts.map(a =>
          a.id === accountId ? { ...a, encryptedPrivateKey: encrypted } : a
        );
        this.saveEncryptedAccounts(updated);
      })
      .catch(() => {
        // Silent: will retry on next unlock
      });
  }

  static updateAccountNetwork(accountId: string, networkId: string): void {
    this.updateAccountsNetwork([accountId], networkId);
  }

  static updateAccountsNetwork(accountIds: string[], networkId: string): void {
    if (!networkId || accountIds.length === 0) {
      return;
    }
    const updates = accountIds.map(id => ({ id, networkId }));
    this.updateAccountsNetworkBulk(updates);
  }

  static updateAccountsNetworkBulk(updates: Array<{ id: string; networkId?: string }>): void {
    if (!updates.length) {
      return;
    }

    try {
      const updateMap = new Map<string, string>();
      updates.forEach(({ id, networkId }) => {
        if (networkId) {
          updateMap.set(id, networkId);
        }
      });

      if (updateMap.size === 0) {
        return;
      }

      this.applyAccountNetworkUpdates(updateMap);
      this.applySessionNetworkUpdates(updateMap);
    } catch (error) {
      console.error('Failed to update account networks:', error);
    }
  }

  private static applyAccountNetworkUpdates(updateMap: Map<string, string>): void {
    const accounts = this.getEncryptedAccounts();
    let accountsChanged = false;

    const updatedAccounts = accounts.map(account => {
      const nextNetworkId = updateMap.get(account.id);
      if (nextNetworkId && account.networkId !== nextNetworkId) {
        accountsChanged = true;
          return {
            ...account,
            networkId: nextNetworkId,
          };
      }
      return account;
    });

    if (accountsChanged) {
      this.saveEncryptedAccounts(updatedAccounts);
    }
  }

  private static applySessionNetworkUpdates(updateMap: Map<string, string>): void {
    const sessionData = this.getSessionData();
    let sessionChanged = false;

    Object.keys(sessionData).forEach(id => {
      const nextNetworkId = updateMap.get(id);
      if (nextNetworkId && sessionData[id].networkId !== nextNetworkId) {
        sessionData[id] = { ...sessionData[id], networkId: nextNetworkId };
        sessionChanged = true;
      }
    });

    if (sessionChanged) {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    }
  }

  static hasAccounts(userId?: string): boolean {
    return this.getEncryptedAccounts(userId).length > 0;
  }

  static getSettings(): SecureStorageData['settings'] {
    return this.cache.settings;
  }

  static updateSettings(settings: Partial<SecureStorageData['settings']>): void {
    this.cache.settings = { ...this.cache.settings, ...settings };
    this.persistSettings();
  }

  // ── Session (sessionStorage for sync reads + IDB for durability) ─────

  private static storeInSession(accountId: string, account: Account): void {
    const sessionData = this.getSessionData();
    sessionData[accountId] = account;
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    this.sessionPort.persist();
  }

  static getUnlockedAccount(accountId: string): Account | null {
    const sessionData = this.getSessionData();
    return sessionData[accountId] ?? null;
  }

  static getAllUnlockedAccounts(): Account[] {
    const sessionData = this.getSessionData();
    return Object.values(sessionData);
  }

  static clearAccountFromSession(accountId: string): void {
    const sessionData = this.getSessionData();
    delete sessionData[accountId];
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    this.sessionPort.persist();
  }

  static clearSession(): void {
    this.sessionPort.remove();
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.AUTH_KEY);
    sessionStorage.removeItem(this.USER_ID_KEY);
    sessionStorage.removeItem(this.SESSION_TOKEN_KEY);
  }

  static setAuthenticated(isAuthenticated: boolean): void {
    if (isAuthenticated) {
      sessionStorage.setItem(this.AUTH_KEY, 'true');
      this.updateLastActivity();
    } else {
      sessionStorage.removeItem(this.AUTH_KEY);
    }
    this.sessionPort.persist();
  }

  static isAuthenticated(): boolean {
    return sessionStorage.getItem(this.AUTH_KEY) === 'true';
  }

  static updateLastActivity(): void {
    sessionStorage.setItem('lastActivity', Date.now().toString());
    this.sessionPort.persistThrottled();
  }

  static getLastActivity(): number {
    const timestamp = sessionStorage.getItem('lastActivity');
    return timestamp ? parseInt(timestamp, 10) : Date.now();
  }

  // ── Account management ──────────────────────────────────────────────

  static removeAccount(accountId: string): void {
    const accounts = this.getEncryptedAccounts();
    const filtered = accounts.filter(a => a.id !== accountId);
    this.saveEncryptedAccounts(filtered);
    this.clearAccountFromSession(accountId);
  }

  static exportAccount(accountId: string): string | null {
    const accounts = this.getEncryptedAccounts();
    const account = accounts.find(a => a.id === accountId);

    if (!account) return null;

    const exportData = {
      version: 1,
      type: 'asi-wallet-keyfile',
      address: account.address,
      revAddress: account.revAddress,
      ethAddress: account.ethAddress,
      encryptedPrivateKey: account.encryptedPrivateKey,
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  private static normalizeAddress(address: string | undefined): string {
    if (!address) return '';
    return address.toLowerCase().trim();
  }

  static accountExists(revAddress?: string, ethAddress?: string, userId?: string): boolean {
    const currentUserId = userId ?? this.getCurrentUserId();
    const existingAccounts = currentUserId
      ? this.getEncryptedAccounts(currentUserId)
      : this.getEncryptedAccounts();
    const normalizedRev = this.normalizeAddress(revAddress);
    const normalizedEth = this.normalizeAddress(ethAddress);

    return existingAccounts.some(existing => {
      const normalizedExistingRev = this.normalizeAddress(existing.revAddress);
      const normalizedExistingEth = this.normalizeAddress(existing.ethAddress);

      if (normalizedRev && normalizedExistingRev && normalizedRev === normalizedExistingRev) {
        return true;
      }
      if (normalizedEth && normalizedExistingEth && normalizedEth === normalizedExistingEth) {
        return true;
      }
      return false;
    });
  }

  static async importFromKeyfile(
    keyfileContent: string,
    name: string,
    networkId?: string,
    userId?: string,
  ): Promise<SecureAccount> {
    try {
      const data = JSON.parse(keyfileContent) as {
        type: string;
        address?: string;
        revAddress?: string;
        ethAddress?: string;
        encryptedPrivateKey?: string;
      };

      if (data.type !== 'asi-wallet-keyfile') {
        throw new Error('Invalid keyfile format');
      }

      const currentUserId = userId ?? this.getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User ID is required. Please login first.');
      }

      const account: SecureAccount = {
        id: Date.now().toString(),
        name,
        address: data.address ?? data.revAddress ?? '',
        revAddress: data.revAddress ?? '',
        ethAddress: data.ethAddress ?? '',
        publicKey: '',
        encryptedPrivateKey: data.encryptedPrivateKey,
        balance: '0',
        userId: currentUserId,
        ...(networkId ? { networkId } : {}),
        createdAt: new Date(),
      };

      if (this.accountExists(account.revAddress, account.ethAddress, currentUserId)) {
        throw new Error('Account with this address already exists');
      }

      const allAccounts = this.getEncryptedAccounts();
      allAccounts.push(account);
      this.saveEncryptedAccounts(allAccounts);
      await this.flush();

      return account;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      throw new Error('Failed to import keyfile: Invalid format');
    }
  }

  // ── Internal: get storage data (reads from cache) ───────────────────

  private static getStorageData(): SecureStorageData {
    return this.cache;
  }

  private static getSessionData(): Record<string, Account> {
    try {
      const stored = sessionStorage.getItem(this.SESSION_KEY);
      if (stored) {
        return JSON.parse(stored) as Record<string, Account>;
      }
    } catch (error) {
      console.error('Failed to parse session data:', error);
    }
    return {};
  }

  // ── General key-value storage (now async via IDB) ───────────────────

  static async setItem(key: string, value: string): Promise<void> {
    const hashedKey = hashValue(key);
    const adapter = StorageProvider.getAdapter();
    if (adapter) {
      await adapter.setItem(hashedKey, value);
      return;
    }
    localStorage.setItem(hashedKey, value);
  }

  static async getItem(key: string): Promise<string | null> {
    const hashedKey = hashValue(key);
    const adapter = StorageProvider.getAdapter();
    if (adapter) {
      const idbValue = await adapter.getItem(hashedKey);
      if (idbValue !== null) {
        return idbValue;
      }
      // Fallback: check localStorage for data not yet migrated
      return localStorage.getItem(hashedKey);
    }
    return localStorage.getItem(hashedKey);
  }

  static async removeItem(key: string): Promise<void> {
    const hashedKey = hashValue(key);
    const adapter = StorageProvider.getAdapter();
    if (adapter) {
      await adapter.removeItem(hashedKey);
    }
    // Also clean up localStorage
    localStorage.removeItem(hashedKey);
  }

  // ── Store encrypted account (alternative method name) ───────────────

  static async storeEncryptedAccount(account: SecureAccount): Promise<void> {
    const accounts = this.getEncryptedAccounts();
    const existingIndex = accounts.findIndex(
      a => a.id === account.id || a.address === account.address,
    );

    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }

    this.saveEncryptedAccounts(accounts);
    await this.flush();
  }

  // ── Clear all persistent storage ────────────────────────────────────

  static async clearAll(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    this.cache = { accounts: [], settings: { ...DEFAULT_SETTINGS } };
    this.clearSession();

    const adapter = StorageProvider.getAdapter();
    if (adapter) {
      await adapter.clear();
    }
  }

  // ── User ID (session-scoped) ────────────────────────────────────────

  static getCurrentUserId(): string | null {
    try {
      return sessionStorage.getItem(this.USER_ID_KEY);
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      return null;
    }
  }

  static setCurrentUserId(userId: string): void {
    try {
      sessionStorage.setItem(this.USER_ID_KEY, userId);
      this.sessionPort.persist();
    } catch (error) {
      console.error('Failed to set current user ID:', error);
    }
  }

  // ── Session token ───────────────────────────────────────────────────

  static generateSessionToken(): string {
    try {
      const cryptoApi = globalThis.crypto as CryptoWithOptionalRandomUUID | undefined;
      if (cryptoApi?.randomUUID) {
        return cryptoApi.randomUUID();
      }
      if (cryptoApi?.getRandomValues) {
        const bytes = new Uint8Array(32);
        cryptoApi.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch { /* fall through */ }

    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  static setSessionToken(token: string): void {
    try {
      sessionStorage.setItem(this.SESSION_TOKEN_KEY, token);
      this.sessionPort.persist();
    } catch (e) {
      console.error('Failed to set session token:', e);
    }
  }

  static getSessionToken(): string | null {
    try {
      return sessionStorage.getItem(this.SESSION_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to get session token:', e);
      return null;
    }
  }

  static clearSessionToken(): void {
    try {
      sessionStorage.removeItem(this.SESSION_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to clear session token:', e);
    }
  }

  static hasSessionToken(): boolean {
    return !!this.getSessionToken();
  }

  static generateUserIdFromPassword(password: string, profileName?: string): string {
    if (profileName) {
      return hashValue(`user_${profileName}_${password}`);
    }
    return hashValue(`user_${password}`);
  }
}