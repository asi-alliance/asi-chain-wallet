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

export interface StorageAdapter {
  ready(): Promise<void>;
  close(): Promise<void>;

  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}