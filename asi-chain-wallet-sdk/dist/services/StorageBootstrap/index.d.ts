import { IStorageFabricOptions } from "@fabrics/storage";
export interface IStorageBootstrapOptions {
    storageOptions?: IStorageFabricOptions;
    withInsensitiveCacheStorage?: boolean;
}
declare class StorageBootstrap {
    private static createMigrationRunner;
    static init: ({ storageOptions, withInsensitiveCacheStorage, }?: IStorageBootstrapOptions) => Promise<void>;
    static close: () => void;
}
export default StorageBootstrap;
