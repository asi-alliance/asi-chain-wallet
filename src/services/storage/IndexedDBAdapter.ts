import {
    StorageAdapter,
    StoreName,
    TransactionMode,
    StorageError,
} from "./types";

const DB_NAME = "asi_wallet_db";
const DB_VERSION = 3;

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
}
