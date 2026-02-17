import { encrypt, decrypt, hashValue } from 'utils/encryption';
import { Account } from 'types/wallet';

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

export class SecureStorage {
  private static readonly STORAGE_KEY = hashValue('asi_wallet_secure_v2');
  private static readonly SESSION_KEY = hashValue('asi_wallet_session_v2');
  private static readonly AUTH_KEY = hashValue('asi_wallet_auth_v2');
  private static readonly USER_ID_KEY = hashValue('asi_wallet_user_id_v2');
  private static readonly SESSION_TOKEN_KEY = hashValue('asi_wallet_session_token_v2');

  static saveEncryptedAccounts(accounts: SecureAccount[]): void {
    try {
      const data = this.getStorageData();
      data.accounts = accounts;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save encrypted accounts:', error);
      throw new Error('Failed to save accounts');
    }
  }

  static getEncryptedAccounts(userId?: string): SecureAccount[] {
    try {
      const data = this.getStorageData();
      const accounts = data.accounts;
      
      if (userId) {
        return accounts.filter(account => account.userId === userId);
      }
      
      return accounts;
    } catch (error) {
      console.error('Failed to get encrypted accounts:', error);
      return [];
    }
  }

  static saveAccount(account: Account, password: string, userId?: string, profileName?: string): SecureAccount {
    if (!account.privateKey) {
      throw new Error('Private key is required');
    }

    let currentUserId = userId;
    if (!currentUserId) {
      const nameToUse = profileName || account.name;
      if (!nameToUse) {
        throw new Error('Account name is required to generate user ID');
      }
      currentUserId = this.generateUserIdFromPassword(password, nameToUse);
    }

    const encryptedPrivateKey = encrypt(account.privateKey, password);
    const { privateKey, ...accountWithoutKey } = account;
    const secureAccount: SecureAccount = {
      ...accountWithoutKey,
      encryptedPrivateKey,
      userId: currentUserId
    };

    const allAccounts = this.getEncryptedAccounts();
    const existingIndex = allAccounts.findIndex(a => a.id === account.id);
    
    if (existingIndex >= 0) {
      allAccounts[existingIndex] = secureAccount;
    } else {
      allAccounts.push(secureAccount);
    }

    this.saveEncryptedAccounts(allAccounts);
    return secureAccount;
  }

  static unlockAccount(accountId: string, password: string, userId?: string): Account | null {
    const currentUserId = userId || this.getCurrentUserId();
    if (!currentUserId) {
      return null;
    }

    const allAccounts = this.getEncryptedAccounts();
    const secureAccount = allAccounts.find(a => a.id === accountId);

    if (!secureAccount?.encryptedPrivateKey) {
      return null;
    }

    if (secureAccount.userId) {
      if (secureAccount.userId !== currentUserId) {
        return null;
      }
      if (secureAccount.name) {
        const expectedUserId = this.generateUserIdFromPassword(password, secureAccount.name);
        if (expectedUserId !== secureAccount.userId) {
          return null;
        }
      }
    } else {
      if (secureAccount.name) {
        const expectedUserId = this.generateUserIdFromPassword(password, secureAccount.name);
        if (expectedUserId !== currentUserId) {
          return null;
        }
      }
    }

    const privateKey = decrypt(secureAccount.encryptedPrivateKey, password);
    if (!privateKey) {
      return null;
    }

    const { encryptedPrivateKey, userId: _, ...accountData } = secureAccount;
    const account: Account = {
      ...accountData,
      privateKey
    };

    this.storeInSession(accountId, account);

    return account;
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

      const sessionData = this.getSessionData();
      let sessionChanged = false;

      Object.keys(sessionData).forEach(id => {
        const nextNetworkId = updateMap.get(id);
        if (nextNetworkId && sessionData[id].networkId !== nextNetworkId) {
          sessionData[id] = {
            ...sessionData[id],
            networkId: nextNetworkId,
          };
          sessionChanged = true;
        }
      });

      if (sessionChanged) {
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      }
    } catch (error) {
      console.error('Failed to update account networks:', error);
    }
  }

  static hasAccounts(userId?: string): boolean {
    return this.getEncryptedAccounts(userId).length > 0;
  }

  static getSettings(): SecureStorageData['settings'] {
    const data = this.getStorageData();
    return data.settings;
  }

  /**
   * Update settings
   */
  static updateSettings(settings: Partial<SecureStorageData['settings']>): void {
    const data = this.getStorageData();
    data.settings = { ...data.settings, ...settings };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Store unlocked account in session
   */
  private static storeInSession(accountId: string, account: Account): void {
    const sessionData = this.getSessionData();
    sessionData[accountId] = account;
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
  }

  /**
   * Get unlocked account from session
   */
  static getUnlockedAccount(accountId: string): Account | null {
    const sessionData = this.getSessionData();
    return sessionData[accountId] || null;
  }

  /**
   * Get all unlocked accounts from session
   */
  static getAllUnlockedAccounts(): Account[] {
    const sessionData = this.getSessionData();
    return Object.values(sessionData);
  }

  /**
   * Clear specific account from session
   */
  static clearAccountFromSession(accountId: string): void {
    const sessionData = this.getSessionData();
    delete sessionData[accountId];
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
  }

  /**
   * Clear all session data
   */
  static clearSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.AUTH_KEY);
    sessionStorage.removeItem(this.USER_ID_KEY);
    sessionStorage.removeItem(this.SESSION_TOKEN_KEY);
  }

  /**
   * Set authentication state
   */
  static setAuthenticated(isAuthenticated: boolean): void {
    if (isAuthenticated) {
      sessionStorage.setItem(this.AUTH_KEY, 'true');
      this.updateLastActivity();
    } else {
      sessionStorage.removeItem(this.AUTH_KEY);
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return sessionStorage.getItem(this.AUTH_KEY) === 'true';
  }

  /**
   * Update last activity timestamp
   */
  static updateLastActivity(): void {
    sessionStorage.setItem('lastActivity', Date.now().toString());
  }

  /**
   * Get last activity timestamp
   */
  static getLastActivity(): number {
    const timestamp = sessionStorage.getItem('lastActivity');
    return timestamp ? parseInt(timestamp, 10) : Date.now();
  }

  /**
   * Remove an account completely
   */
  static removeAccount(accountId: string): void {
    const accounts = this.getEncryptedAccounts();
    const filtered = accounts.filter(a => a.id !== accountId);
    this.saveEncryptedAccounts(filtered);
    this.clearAccountFromSession(accountId);
  }

  /**
   * Export account as encrypted JSON
   */
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
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }


  private static normalizeAddress(address: string | undefined): string {
    if (!address) return '';
    return address.toLowerCase().trim();
  }

  static accountExists(revAddress?: string, ethAddress?: string, userId?: string): boolean {
    const currentUserId = userId || this.getCurrentUserId();
    const existingAccounts = currentUserId ? this.getEncryptedAccounts(currentUserId) : this.getEncryptedAccounts();
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

  static importFromKeyfile(keyfileContent: string, name: string, networkId?: string, userId?: string): SecureAccount {
    try {
      const data = JSON.parse(keyfileContent);
      
      if (data.type !== 'asi-wallet-keyfile') {
        throw new Error('Invalid keyfile format');
      }

      const currentUserId = userId || this.getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User ID is required. Please login first.');
      }

      const account: SecureAccount = {
        id: Date.now().toString(),
        name,
        address: data.address || data.revAddress,
        revAddress: data.revAddress,
        ethAddress: data.ethAddress,
        publicKey: '', // Will be derived when unlocked
        encryptedPrivateKey: data.encryptedPrivateKey,
        balance: '0',
        userId: currentUserId,
        ...(networkId ? { networkId } : {}),
        createdAt: new Date()
      };

      if (this.accountExists(account.revAddress, account.ethAddress, currentUserId)) {
        throw new Error('Account with this address already exists');
      }

      const allAccounts = this.getEncryptedAccounts();
      allAccounts.push(account);
      this.saveEncryptedAccounts(allAccounts);

      return account;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      throw new Error('Failed to import keyfile: Invalid format');
    }
  }

  /**
   * Get storage data with defaults
   */
  private static getStorageData(): SecureStorageData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to parse storage data:', error);
    }

    return {
      accounts: [],
      settings: {
        requirePasswordForTransaction: false,
        idleTimeout: 15
      }
    };
  }

  /**
   * Get session data
   */
  private static getSessionData(): Record<string, Account> {
    try {
      const stored = sessionStorage.getItem(this.SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to parse session data:', error);
    }
    return {};
  }

  /**
   * Static methods for general storage operations
   */
  static async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(hashValue(key), value);
  }

  static async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(hashValue(key));
  }

  static async removeItem(key: string): Promise<void> {
    localStorage.removeItem(hashValue(key));
  }

  /**
   * Store encrypted account (alternative method name)
   */
  static async storeEncryptedAccount(account: SecureAccount): Promise<void> {
    const accounts = this.getEncryptedAccounts();
    const existingIndex = accounts.findIndex(a => a.id === account.id || a.address === account.address);
    
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }
    
    this.saveEncryptedAccounts(accounts);
  }

  /**
   * Clear all storage
   */
  static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.clearSession();
  }

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
    } catch (error) {
      console.error('Failed to set current user ID:', error);
    }
  }

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
    } catch {}

    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  static setSessionToken(token: string): void {
    try {
      sessionStorage.setItem(this.SESSION_TOKEN_KEY, token);
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

  /**
   * Helper for sensitive actions.
   * If token is missing -> treat session as expired.
   */
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