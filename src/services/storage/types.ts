export enum StoreName {
  Accounts = 'accounts',
  Settings = 'settings',
  General = 'general',
  Sessions = 'sessions',
}

export enum TransactionMode {
  ReadOnly = 'readonly',
  ReadWrite = 'readwrite',
}

export enum StorageStatus {
  Available = 'available',
  Unavailable = 'unavailable',
  Pending = 'pending',
}

export enum StorageError {
  AdapterClosed = 'IndexedDBAdapter is closed and cannot process requests',
  IDBRequestFailed = 'IDBRequest failed',
  TransactionFailed = 'Transaction failed',
  TransactionAborted = 'Transaction aborted',
  DatabaseOpenFailed = 'Failed to open database',
}

export interface GeneralRecord {
  key: string;
  value: string;
}

export interface SettingsRecord {
  id: string;
  requirePasswordForTransaction: boolean;
  idleTimeout: number;
}

export interface SessionRecord {
  token: string;
  userId: string;
  isAuthenticated: boolean;
  lastActivity: number;
  unlockedAccounts: string; // JSON-serialised Record<string, Account>
  updatedAt: number;
}

export interface StoredAccountRecord {
  id: string;
  name: string;
  address: string;
  revAddress: string;
  ethAddress: string;
  publicKey: string;
  encryptedPrivateKey?: string;
  balance: string;
  isMetamask?: boolean;
  networkId?: string;
  userId?: string;
  derivationPath?: string;
  isHardwareWallet?: boolean;
  createdAt: string;
}

export interface StorageAdapter {
  ready(): Promise<void>;
  close(): Promise<void>;
  clear(): Promise<void>;

  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;

  getAllAccounts(): Promise<StoredAccountRecord[]>;
  putAccount(account: StoredAccountRecord): Promise<void>;
  putAccounts(accounts: StoredAccountRecord[]): Promise<void>;
  deleteAccount(id: string): Promise<void>;

  getSettings(): Promise<SettingsRecord | null>;
  putSettings(settings: SettingsRecord): Promise<void>;

  getSession(token: string): Promise<SessionRecord | null>;
  putSession(session: SessionRecord): Promise<void>;
  deleteSession(token: string): Promise<void>;
  deleteSessionsOlderThan(maxAgeMs: number): Promise<number>;
}