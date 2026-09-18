import { ITableRecord } from "@domains/TableService";
import { IStorageFabricOptions } from "@fabrics/storage";
import { BaseStorageRepository } from "@domains/BaseStorageRepository";
declare const STORAGE_METADATA_DATA_KEY: string;
declare const STORAGE_SCHEMA_RECORD_ID: string;
export interface IStorageMetadataRecord extends ITableRecord {
    version: number;
    pendingVersion?: number | null;
    rollbackFailure?: string | null;
    createdAt: number;
    updatedAt?: number;
}
export declare class StorageMetadataStorageRepository extends BaseStorageRepository<IStorageMetadataRecord> {
    private static instance;
    constructor(options?: IStorageFabricOptions);
    static getInstance(options?: IStorageFabricOptions): StorageMetadataStorageRepository;
    private updateSchemaRecord;
    getVersion(): Promise<number | null>;
    saveVersion(version: number): Promise<void>;
    getPendingVersion(): Promise<number | null>;
    markPendingMigration(version: number): Promise<void>;
    clearPendingMigration(): Promise<void>;
    getRollbackFailure(): Promise<string | null>;
    markRollbackFailure(reason: string): Promise<void>;
}
export { STORAGE_METADATA_DATA_KEY, STORAGE_SCHEMA_RECORD_ID };
