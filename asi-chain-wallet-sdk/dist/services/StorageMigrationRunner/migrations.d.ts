import type { ITableRecord, ITableService } from "@domains/TableService";
export interface IStorageMigration {
    version: number;
    description: string;
    resumable: boolean;
    run(storage: ITableService<ITableRecord>): Promise<void>;
}
export declare const STORAGE_MIGRATIONS: IStorageMigration[];
