import {
  StorageAdapter,
  StoredAccountRecord,
  SettingsRecord,
  StoreName,
  TransactionMode,
} from './types';

const DB_NAME = 'asi_wallet_db';
const DB_VERSION = 1;
const DEFAULT_SETTINGS_ID = 'default';

function toError(domError: DOMException | null, fallbackMessage: string): Error {
  if (domError) {
    return new Error(domError.message);
  }
  return new Error(fallbackMessage);
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(toError(request.error, 'IDBRequest failed'));
  });
}

function commitTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(toError(tx.error, 'Transaction failed'));
    tx.onabort = () => reject(toError(tx.error, 'Transaction aborted'));
    tx.commit();
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request: IDBOpenDBRequest = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      createStores(db);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(toError(request.error, 'Failed to open database'));
  });
}

function createStores(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(StoreName.Accounts)) {
    const accountStore = db.createObjectStore(StoreName.Accounts, { keyPath: 'id' });
    accountStore.createIndex('userId', 'userId', { unique: false });
  }

  if (!db.objectStoreNames.contains(StoreName.Settings)) {
    db.createObjectStore(StoreName.Settings, { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains(StoreName.General)) {
    db.createObjectStore(StoreName.General, { keyPath: 'key' });
  }
}

export class IndexedDBAdapter implements StorageAdapter {
  private readonly dbPromise: Promise<IDBDatabase>;

  private constructor(dbPromise: Promise<IDBDatabase>) {
    this.dbPromise = dbPromise;
  }

  static create(): IndexedDBAdapter {
    return new IndexedDBAdapter(openDatabase());
  }

  async ready(): Promise<void> {
    await this.dbPromise;
  }

  async close(): Promise<void> {
    const db = await this.dbPromise;
    db.close();
  }

  private async getStore(
    name: StoreName,
    mode: TransactionMode,
  ): Promise<{ store: IDBObjectStore; tx: IDBTransaction }> {
    const db = await this.dbPromise;
    const tx = db.transaction(name, mode);
    const store = tx.objectStore(name);
    return { store, tx };
  }

  private async getMultiStore(
    names: StoreName[],
    mode: TransactionMode,
  ): Promise<{ stores: Map<StoreName, IDBObjectStore>; tx: IDBTransaction }> {
    const db = await this.dbPromise;
    const tx = db.transaction(names, mode);
    const stores = new Map<StoreName, IDBObjectStore>();
    for (const name of names) {
      stores.set(name, tx.objectStore(name));
    }
    return { stores, tx };
  }

  async getItem(key: string): Promise<string | null> {
    const { store } = await this.getStore(StoreName.General, TransactionMode.ReadOnly);
    const record = await promisifyRequest<{ key: string; value: string } | undefined>(
      store.get(key),
    );
    return record?.value ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    const { store, tx } = await this.getStore(StoreName.General, TransactionMode.ReadWrite);
    store.put({ key, value });
    await commitTransaction(tx);
  }

  async removeItem(key: string): Promise<void> {
    const { store, tx } = await this.getStore(StoreName.General, TransactionMode.ReadWrite);
    store.delete(key);
    await commitTransaction(tx);
  }

  async getAllAccounts(): Promise<StoredAccountRecord[]> {
    const { store } = await this.getStore(StoreName.Accounts, TransactionMode.ReadOnly);
    return promisifyRequest<StoredAccountRecord[]>(store.getAll());
  }

  async getAccountById(id: string): Promise<StoredAccountRecord | null> {
    const { store } = await this.getStore(StoreName.Accounts, TransactionMode.ReadOnly);
    const result = await promisifyRequest<StoredAccountRecord | undefined>(store.get(id));
    return result ?? null;
  }

  async getAccountsByUserId(userId: string): Promise<StoredAccountRecord[]> {
    const { store } = await this.getStore(StoreName.Accounts, TransactionMode.ReadOnly);
    const index = store.index('userId');
    return promisifyRequest<StoredAccountRecord[]>(index.getAll(userId));
  }

  async putAccount(account: StoredAccountRecord): Promise<void> {
    const { store, tx } = await this.getStore(StoreName.Accounts, TransactionMode.ReadWrite);
    store.put(account);
    await commitTransaction(tx);
  }

  async putAccounts(accounts: StoredAccountRecord[]): Promise<void> {
    const { store, tx } = await this.getStore(StoreName.Accounts, TransactionMode.ReadWrite);
    for (const account of accounts) {
      store.put(account);
    }
    await commitTransaction(tx);
  }

  async deleteAccount(id: string): Promise<void> {
    const { store, tx } = await this.getStore(StoreName.Accounts, TransactionMode.ReadWrite);
    store.delete(id);
    await commitTransaction(tx);
  }

  async getSettings(): Promise<SettingsRecord | null> {
    const { store } = await this.getStore(StoreName.Settings, TransactionMode.ReadOnly);
    const result = await promisifyRequest<SettingsRecord | undefined>(
      store.get(DEFAULT_SETTINGS_ID),
    );
    return result ?? null;
  }

  async putSettings(settings: SettingsRecord): Promise<void> {
    const record: SettingsRecord = { ...settings, id: DEFAULT_SETTINGS_ID };
    const { store, tx } = await this.getStore(StoreName.Settings, TransactionMode.ReadWrite);
    store.put(record);
    await commitTransaction(tx);
  }

  async clear(): Promise<void> {
    const allStores: StoreName[] = [StoreName.Accounts, StoreName.Settings, StoreName.General];
    const { stores, tx } = await this.getMultiStore(allStores, TransactionMode.ReadWrite);
    stores.forEach((store) => {
      store.clear();
    });
    await commitTransaction(tx);
  }
}