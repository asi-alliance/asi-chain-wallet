export enum StoreName {
  Accounts = 'accounts',
  Settings = 'settings',
  General = 'general',
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

export interface GeneralRecord {
  key: string;
  value: string;
}

export interface SettingsRecord {
  id: string;
  requirePasswordForTransaction: boolean;
  idleTimeout: number;
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
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;

  getAllAccounts(): Promise<StoredAccountRecord[]>;
  getAccountById(id: string): Promise<StoredAccountRecord | null>;
  getAccountsByUserId(userId: string): Promise<StoredAccountRecord[]>;
  putAccount(account: StoredAccountRecord): Promise<void>;
  putAccounts(accounts: StoredAccountRecord[]): Promise<void>;
  deleteAccount(id: string): Promise<void>;

  getSettings(): Promise<SettingsRecord | null>;
  putSettings(settings: SettingsRecord): Promise<void>;

  clear(): Promise<void>;
}