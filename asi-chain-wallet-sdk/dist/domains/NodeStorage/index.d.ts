import { ITableRecord, ITableService } from "@domains/TableService";
export default class NodeStorage implements ITableService<ITableRecord> {
    private static instance;
    private readonly storageDir;
    private storageInterface;
    constructor(storageDir?: string);
    static getInstance(storageDir?: string): NodeStorage;
    init(): Promise<void>;
    private getTableKey;
    private getTable;
    private saveTable;
    createTable(tableName: string, _keyPath: string): Promise<void>;
    insert(tableName: string, record: ITableRecord): Promise<void>;
    insertMany(tableName: string, records: ITableRecord[]): Promise<void>;
    getById(tableName: string, id: string | number): Promise<ITableRecord | null>;
    getAll(tableName: string): Promise<ITableRecord[]>;
    update(tableName: string, id: string | number, data: Partial<ITableRecord>): Promise<void>;
    delete(tableName: string, id: string | number): Promise<void>;
    deleteMany(tableName: string, ids: (string | number)[]): Promise<void>;
    clearTable(tableName: string): Promise<void>;
    dropTable(tableName: string): Promise<void>;
    isInitialized(): boolean;
    getKeys(): Promise<string[]>;
    tableExists(tableName: string): Promise<boolean>;
    close(): Promise<void>;
}
