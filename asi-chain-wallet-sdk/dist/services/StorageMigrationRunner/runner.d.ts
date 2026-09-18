import { ITableRecord, ITableService } from "@domains/TableService";
import { StorageMetadataStorageRepository } from "@domains/StorageMetadataStorageRepository";
import { IStorageMigration } from "./migrations";
export interface IStorageMigrationRunnerOptions {
    storage: ITableService<ITableRecord>;
    metadataRepository: StorageMetadataStorageRepository;
    tables: string[];
    migrations?: IStorageMigration[];
    currentVersion?: number;
}
export default class StorageMigrationRunner {
    private readonly storage;
    private readonly metadataRepository;
    private readonly tables;
    private readonly migrations;
    private readonly currentVersion;
    constructor({ storage, metadataRepository, tables, migrations, currentVersion, }: IStorageMigrationRunnerOptions);
    private resolveStoredVersion;
    private getPendingMigrations;
    private describeFailure;
    private createBackup;
    private dropTablesCreatedByMigration;
    private restoreTable;
    private restoreBackup;
    private revertMigration;
    private runMigrationStep;
    private applyMigration;
    private assertInterruptedMigrationIsResumable;
    private assertDeclaredVersionsAreValid;
    private assertChainIsComplete;
    assertCompatible(): Promise<void>;
    run(): Promise<number>;
}
