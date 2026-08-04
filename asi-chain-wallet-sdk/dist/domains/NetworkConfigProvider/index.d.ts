import { INetworkConfig, INetworkRecord, INetworkUpdate, NetworkId, NetworkName, TNetworksConfig } from "@domains/Network";
export default class NetworkConfigProvider {
    private networksRecords;
    private validateConfigUrls;
    initialize(config: TNetworksConfig): void;
    restoreCustomNetworks(records: INetworkRecord[]): void;
    getAll(): INetworkRecord[];
    get(id: NetworkId): INetworkRecord;
    getIds(): NetworkId[];
    add(name: NetworkName, networkConfig: INetworkConfig): INetworkRecord;
    remove(id: NetworkId): INetworkRecord;
    update(id: NetworkId, update: INetworkUpdate): void;
    isReady(): boolean;
}
