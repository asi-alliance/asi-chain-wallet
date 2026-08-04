import { ITableRecord, ITableService } from "@domains/TableService";
export default class BrowserStorage implements ITableService<ITableRecord> {
    private static instance;
    private readonly name;
    private storageInterface;
    constructor(name?: string);
    static getInstance(name?: string): BrowserStorage;
    init(): Promise<IDBDatabase>;
    createTable(tableName: string, keyPath?: string): Promise<void>;
    insert(tableName: string, record: ITableRecord): Promise<void>;
    insertMany(tableName: string, records: ITableRecord[]): Promise<void>;
    getById(tableName: string, id: string | number): Promise<ITableRecord | null>;
    getAll(tableName: string): Promise<ITableRecord[]>;
    update(tableName: string, id: string | number, data: Partial<ITableRecord>): Promise<void>;
    delete(tableName: string, id: string | number): Promise<void>;
    deleteMany(tableName: string, ids: (string | number)[]): Promise<void>;
    clearTable(tableName: string): Promise<void>;
    dropTable(tableName: string): Promise<void>;
    tableExists(tableName: string): Promise<boolean>;
    getVersion(): number;
    getDatabaseName(): string;
    getTableNamesList(): string[];
    private executeTransaction;
    isInitialized(): boolean;
    close(): Promise<void>;
}
