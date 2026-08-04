export interface ITableRecord {
    id: string;
    [key: string]: any;
}
export interface ITableService<T extends ITableRecord> {
    createTable(tableName: string, keyPath?: string): Promise<void>;
    insert(tableName: string, record: T): Promise<void>;
    insertMany(tableName: string, records: T[]): Promise<void>;
    getById(tableName: string, id: string | number): Promise<T | null>;
    getAll(tableName: string): Promise<T[]>;
    update(tableName: string, id: string | number, data: Partial<T>): Promise<void>;
    delete(tableName: string, id: string | number): Promise<void>;
    deleteMany(tableName: string, ids: (string | number)[]): Promise<void>;
    clearTable(tableName: string): Promise<void>;
    dropTable(tableName: string): Promise<void>;
    tableExists(tableName: string): Promise<boolean>;
    close: () => Promise<void>;
    init(): Promise<any>;
    isInitialized(): boolean;
}
