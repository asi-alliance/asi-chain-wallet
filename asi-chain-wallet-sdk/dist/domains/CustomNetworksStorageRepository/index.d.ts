import { INetworkConfig, NetworkId, NetworkName } from "@domains/Network";
import { ITableRecord } from "@domains/TableService";
import { IStorageFabricOptions } from "@fabrics/Storage";
import { BaseStorageRepository } from "@domains/BaseStorageRepository";
declare const CUSTOM_NETWORKS_DATA_KEY: string;
export interface ICustomNetworkStorageRecord extends ITableRecord {
    name: NetworkName;
    config: INetworkConfig;
    createdAt: number;
    updatedAt?: number;
}
export declare class CustomNetworksStorageRepository extends BaseStorageRepository<ICustomNetworkStorageRecord> {
    private static instance;
    constructor(options?: IStorageFabricOptions);
    static getInstance(options?: IStorageFabricOptions): CustomNetworksStorageRepository;
    saveCustomNetwork(id: NetworkId, name: NetworkName, config: INetworkConfig): Promise<void>;
    getAllCustomNetworks(): Promise<ICustomNetworkStorageRecord[]>;
    updateCustomNetwork(id: NetworkId, updates: Partial<ICustomNetworkStorageRecord>): Promise<void>;
    deleteCustomNetwork(id: NetworkId): Promise<void>;
}
export { CUSTOM_NETWORKS_DATA_KEY };
