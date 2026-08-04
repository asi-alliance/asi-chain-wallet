import { ITableRecord, ITableService } from "@domains/TableService";
import { IStorageFabricOptions } from "@fabrics/Storage";
export declare abstract class BaseStorageRepository<T extends ITableRecord> {
    protected readonly tableName: string;
    protected storageInterface: ITableService<ITableRecord>;
    private isInitialized;
    private initPromise;
    protected constructor(tableName: string, options?: IStorageFabricOptions);
    initialize(): Promise<void>;
    private doInitialize;
    protected ensureInitialized(): Promise<void>;
    getRawDB(): ITableService<ITableRecord>;
    protected insertRecord(record: T): Promise<void>;
    protected insertManyRecords(records: T[]): Promise<void>;
    protected getRecordById(id: string): Promise<T | null>;
    protected getAllRecords(): Promise<T[]>;
    protected updateRecord(id: string, updates: Partial<T>): Promise<void>;
    protected deleteRecord(id: string): Promise<void>;
    protected deleteManyRecords(ids: string[]): Promise<void>;
    protected hasRecord(id: string): Promise<boolean>;
    protected getRecordsCount(): Promise<number>;
    clearAllData(): Promise<void>;
    clearTable(tableName: string): Promise<void>;
    isReady(): boolean;
    getTablesList(): Promise<string[]>;
    close(): void;
}
