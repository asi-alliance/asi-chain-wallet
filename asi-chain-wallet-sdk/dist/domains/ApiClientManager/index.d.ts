import IndexerClient from "@domains/IndexerClient";
import ObserverClient from "@domains/ObserverClient";
import ValidatorClient from "@domains/ValidatorClient";
import { INetworkConfig, INetworkRecord, INetworkUpdate, NetworkId, NetworkName, TNetworksConfig } from "@domains/Network";
export interface IApiClients {
    validator: ValidatorClient;
    observer: ObserverClient;
    indexer: IndexerClient;
}
export default class ApiClientManager {
    private static instance;
    private readonly networkConfigProvider;
    private validatorClient;
    private observerClient;
    private indexerClient;
    private currentNetworkId;
    private isInitialized;
    private constructor();
    static getInstance(): ApiClientManager;
    initialize(networksConfig: TNetworksConfig, customNetworks?: INetworkRecord[], networkName?: NetworkName): void;
    switchNetwork(networkId: NetworkId): void;
    getValidatorClient(): ValidatorClient;
    getObserverClient(): ObserverClient;
    getIndexerClient(): IndexerClient;
    getClients(): {
        validator: ValidatorClient;
        observer: ObserverClient;
        indexer: IndexerClient;
    };
    getCurrentNetworkId(): NetworkId;
    getCurrentNetwork(): INetworkRecord;
    getNetworkIds(): NetworkId[];
    getNetworks(): INetworkRecord[];
    getNetwork(id: NetworkId): INetworkRecord;
    addNetwork(name: NetworkName, config: INetworkConfig): INetworkRecord;
    updateNetwork(id: NetworkId, update: INetworkUpdate): void;
    removeNetwork(id: NetworkId): void;
    isReady(): boolean;
    close(): void;
}
