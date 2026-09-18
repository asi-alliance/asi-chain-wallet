import { INetworkConfig, INetworkRecord, INetworkUpdate, IPersistedNetworkRecord, NetworkId, NetworkName, TNetworksConfig } from "@domains/Network";
export default class NetworkConfigProvider {
    private networksRecords;
    private validateConfigUrls;
    private validateConfigProfile;
    initialize(config: TNetworksConfig): void;
    restoreCustomNetworks(records: IPersistedNetworkRecord[]): void;
    getAll(): INetworkRecord[];
    get(id: NetworkId): INetworkRecord;
    getIds(): NetworkId[];
    add(name: NetworkName, networkConfig: INetworkConfig): INetworkRecord;
    remove(id: NetworkId): INetworkRecord;
    update(id: NetworkId, update: INetworkUpdate): void;
    isReady(): boolean;
}
