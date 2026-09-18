import IndexerClient from "@domains/IndexerClient";
import ObserverClient from "@domains/ObserverClient";
import ValidatorClient from "@domains/ValidatorClient";
import { INetworkConfig, INetworkContext, INetworkRecord, INetworkUpdate, IPersistedNetworkRecord, NetworkId, NetworkName, TNetworkBusyListener, TNetworksConfig } from "@domains/Network";
export interface IApiClients {
    validator: ValidatorClient;
    observer: ObserverClient;
    indexer: IndexerClient;
}
export interface INetworkOperationOptions {
    onBusyChanged?: TNetworkBusyListener;
    networkId?: NetworkId;
}
export default class ApiClientManager {
    private static instance;
    private readonly networkConfigProvider;
    private readonly networkBusyRegistry;
    private validatorClient;
    private observerClient;
    private indexerClient;
    private currentNetworkId;
    private isInitialized;
    private constructor();
    static getInstance(): ApiClientManager;
    initialize(networksConfig: TNetworksConfig, customNetworks?: IPersistedNetworkRecord[], networkName?: NetworkName): void;
    switchNetwork(networkId: NetworkId): void;
    getValidatorClient(): ValidatorClient;
    getObserverClient(): ObserverClient;
    getIndexerClient(): IndexerClient;
    getClients(): IApiClients;
    getCurrentNetworkId(): NetworkId;
    getCurrentNetwork(): INetworkRecord;
    getNetworkIds(): NetworkId[];
    getNetworks(): INetworkRecord[];
    getNetwork(id: NetworkId): INetworkRecord;
    isNetworkBusy(networkId: NetworkId): boolean;
    runNetworkOperation<TResult>(operation: () => Promise<TResult>, { onBusyChanged, networkId }?: INetworkOperationOptions): Promise<TResult>;
    createNetworkContext(networkId?: NetworkId): INetworkContext;
    addNetwork(name: NetworkName, config: INetworkConfig): INetworkRecord;
    updateNetwork(id: NetworkId, update: INetworkUpdate): void;
    removeNetwork(id: NetworkId): void;
    isReady(): boolean;
    close(): void;
}
