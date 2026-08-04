import { ITableRecord, ITableService } from "@domains/TableService";
export interface IStorageFabricOptions {
    nodeStorageDir?: string;
}
export declare const storageFabric: (options?: IStorageFabricOptions) => ITableService<ITableRecord>;
