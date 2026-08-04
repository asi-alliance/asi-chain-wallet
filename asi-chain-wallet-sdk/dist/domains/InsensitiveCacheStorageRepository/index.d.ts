import { ITableRecord } from "@domains/TableService";
import { BaseStorageRepository } from "@domains/BaseStorageRepository";
declare const INSENSITIVE_CACHE_TABLE_KEY = "INSENSITIVE_CACHE";
export interface IInsensitiveCacheRecord extends ITableRecord {
    address: string;
    publicKey: string;
}
export declare class InsensitiveCacheStorageRepository extends BaseStorageRepository<IInsensitiveCacheRecord> {
    private static instance;
    constructor();
    static getInstance(): InsensitiveCacheStorageRepository;
    saveRecord(record: IInsensitiveCacheRecord): Promise<void>;
    getRecord(id: string): Promise<IInsensitiveCacheRecord | null>;
    getAllRecords(): Promise<IInsensitiveCacheRecord[]>;
    updateRecord(id: string, updates: Partial<IInsensitiveCacheRecord>): Promise<void>;
    deleteRecord(id: string): Promise<void>;
    clear(): Promise<void>;
}
export { INSENSITIVE_CACHE_TABLE_KEY };
