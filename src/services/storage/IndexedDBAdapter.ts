import {
    StorageAdapter,
    StoredAccountRecord,
    SettingsRecord,
    SessionRecord,
    StoreName,
    TransactionMode,
    StorageError,
} from "./types";

const DB_NAME = "asi_wallet_db";
const DB_VERSION = 3;
const DEFAULT_SETTINGS_ID = "default";

function toError(
    domError: DOMException | null,
    fallbackMessage: string,
): Error {
    return domError ? new Error(domError.message) : new Error(fallbackMessage);
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
            reject(toError(request.error, StorageError.IDBRequestFailed));
    });
}

function commitTransaction(tx: IDBTransaction): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () =>
            reject(toError(tx.error, StorageError.TransactionFailed));
        tx.onabort = () =>
            reject(toError(tx.error, StorageError.TransactionAborted));
        tx.commit();
    });
}

function openDatabase(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request: IDBOpenDBRequest = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const tx = (event.target as IDBOpenDBRequest).transaction;
            createStores(db, event.oldVersion, tx);
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
            reject(toError(request.error, StorageError.DatabaseOpenFailed));
    });
}

function createStores(
    db: IDBDatabase,
    oldVersion: number,
    tx: IDBTransaction | null,
): void {
    if (!db.objectStoreNames.contains(StoreName.Accounts)) {
        const accountStore = db.createObjectStore(StoreName.Accounts, {
            keyPath: "id",
        });
        accountStore.createIndex("userId", "userId", { unique: false });
    }

    if (!db.objectStoreNames.contains(StoreName.Settings)) {
        db.createObjectStore(StoreName.Settings, { keyPath: "id" });
    }

    if (!db.objectStoreNames.contains(StoreName.General)) {
        db.createObjectStore(StoreName.General, { keyPath: "key" });
    }

    if (!db.objectStoreNames.contains(StoreName.Sessions)) {
        const sessionStore = db.createObjectStore(StoreName.Sessions, {
            keyPath: "token",
        });
        sessionStore.createIndex("updatedAt", "updatedAt", { unique: false });
    } else if (oldVersion < 3 && tx) {
        const sessionStore = tx.objectStore(StoreName.Sessions);
        if (sessionStore.indexNames.contains("createdAt")) {
            sessionStore.deleteIndex("createdAt");
        }
        if (!sessionStore.indexNames.contains("updatedAt")) {
            sessionStore.createIndex("updatedAt", "updatedAt", {
                unique: false,
            });
        }
    }
}

export class IndexedDBAdapter implements StorageAdapter {
    private readonly dbPromise: Promise<IDBDatabase>;
    private isClosed = false;

    private constructor(dbPromise: Promise<IDBDatabase>) {
        this.dbPromise = dbPromise;
    }

    static create(): IndexedDBAdapter {
        return new IndexedDBAdapter(openDatabase());
    }

    private ensureOpen(): void {
        if (this.isClosed) throw new Error(StorageError.AdapterClosed);
    }

    async ready(): Promise<void> {
        this.ensureOpen();
        await this.dbPromise;
    }

    async close(): Promise<void> {
        if (this.isClosed) return;
        const db = await this.dbPromise;
        db.close();
        this.isClosed = true;
    }

    private async getStore(
        name: StoreName,
        mode: TransactionMode,
    ): Promise<{ store: IDBObjectStore; tx: IDBTransaction }> {
        this.ensureOpen();
        const db = await this.dbPromise;
        const tx = db.transaction(name, mode);
        return { store: tx.objectStore(name), tx };
    }

    private async getMultiStore(
        names: StoreName[],
        mode: TransactionMode,
    ): Promise<{ stores: Map<StoreName, IDBObjectStore>; tx: IDBTransaction }> {
        this.ensureOpen();
        const db = await this.dbPromise;
        const tx = db.transaction(names, mode);
        const stores = new Map<StoreName, IDBObjectStore>();
        for (const name of names) {
            stores.set(name, tx.objectStore(name));
        }
        return { stores, tx };
    }

    async getItem(key: string): Promise<string | null> {
        const { store } = await this.getStore(
            StoreName.General,
            TransactionMode.ReadOnly,
        );
        const record = await promisifyRequest<
            { key: string; value: string } | undefined
        >(store.get(key));
        return record?.value ?? null;
    }

    async setItem(key: string, value: string): Promise<void> {
        const { store, tx } = await this.getStore(
            StoreName.General,
            TransactionMode.ReadWrite,
        );
        store.put({ key, value });
        await commitTransaction(tx);
    }

    async removeItem(key: string): Promise<void> {
        const { store, tx } = await this.getStore(
            StoreName.General,
            TransactionMode.ReadWrite,
        );
        store.delete(key);
        await commitTransaction(tx);
    }

    async getAllAccounts(): Promise<StoredAccountRecord[]> {
        const { store } = await this.getStore(
            StoreName.Accounts,
            TransactionMode.ReadOnly,
        );
        return promisifyRequest<StoredAccountRecord[]>(store.getAll());
    }

    async putAccount(account: StoredAccountRecord): Promise<void> {
        const { store, tx } = await this.getStore(
            StoreName.Accounts,
            TransactionMode.ReadWrite,
        );
        store.put(account);
        await commitTransaction(tx);
    }

    async putAccounts(accounts: StoredAccountRecord[]): Promise<void> {
        const { store, tx } = await this.getStore(
            StoreName.Accounts,
            TransactionMode.ReadWrite,
        );
        for (const account of accounts) {
            store.put(account);
        }
        await commitTransaction(tx);
    }

    async deleteAccount(id: string): Promise<void> {
        const { store, tx } = await this.getStore(
            StoreName.Accounts,
            TransactionMode.ReadWrite,
        );

        store.delete(id);
        await commitTransaction(tx);
    }

    async getSettings(): Promise<SettingsRecord | null> {
        const { store } = await this.getStore(
            StoreName.Settings,
            TransactionMode.ReadOnly,
        );
        const result = await promisifyRequest<SettingsRecord | undefined>(
            store.get(DEFAULT_SETTINGS_ID),
        );
        return result ?? null;
    }

    async putSettings(settings: SettingsRecord): Promise<void> {
        const record: SettingsRecord = { ...settings, id: DEFAULT_SETTINGS_ID };
        const { store, tx } = await this.getStore(
            StoreName.Settings,
            TransactionMode.ReadWrite,
        );
        store.put(record);
        await commitTransaction(tx);
    }

    async getSession(token: string): Promise<SessionRecord | null> {
        const { store } = await this.getStore(
            StoreName.Sessions,
            TransactionMode.ReadOnly,
        );
        const result = await promisifyRequest<SessionRecord | undefined>(
            store.get(token),
        );
        return result ?? null;
    }

    async putSession(session: SessionRecord): Promise<void> {
        const { store, tx } = await this.getStore(
            StoreName.Sessions,
            TransactionMode.ReadWrite,
        );
        store.put(session);
        await commitTransaction(tx);
    }

    async deleteSession(token: string): Promise<void> {
        const { store, tx } = await this.getStore(
            StoreName.Sessions,
            TransactionMode.ReadWrite,
        );
        store.delete(token);
        await commitTransaction(tx);
    }

    async deleteSessionsOlderThan(maxAgeMs: number): Promise<number> {
        const cutoff = Date.now() - maxAgeMs;
        const { store, tx } = await this.getStore(
            StoreName.Sessions,
            TransactionMode.ReadWrite,
        );
        const index = store.index("updatedAt");
        const range = IDBKeyRange.upperBound(cutoff);
        const staleRecords = await promisifyRequest<SessionRecord[]>(
            index.getAll(range),
        );
        for (const record of staleRecords) {
            store.delete(record.token);
        }
        await commitTransaction(tx);
        return staleRecords.length;
    }

    async clear(): Promise<void> {
        const allStores: StoreName[] = [
            StoreName.Accounts,
            StoreName.Settings,
            StoreName.General,
            StoreName.Sessions,
        ];
        const { stores, tx } = await this.getMultiStore(
            allStores,
            TransactionMode.ReadWrite,
        );
        stores.forEach((store) => store.clear());
        await commitTransaction(tx);
    }
}
