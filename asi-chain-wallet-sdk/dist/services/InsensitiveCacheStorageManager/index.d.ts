import { IInsensitiveCacheRecord } from "@domains/InsensitiveCacheStorageRepository";
declare class InsensitiveCacheStorageManager {
    static init: () => Promise<void>;
    static save: (record: IInsensitiveCacheRecord) => Promise<void>;
    static get: (id: string) => Promise<IInsensitiveCacheRecord | null>;
    static getAll: () => Promise<IInsensitiveCacheRecord[]>;
    static update: (id: string, updates: Partial<IInsensitiveCacheRecord>) => Promise<void>;
    static delete: (id: string) => Promise<void>;
    static deleteAll: (ids: string[]) => Promise<void>;
    static clear: () => Promise<void>;
    static close: () => void;
}
export default InsensitiveCacheStorageManager;
