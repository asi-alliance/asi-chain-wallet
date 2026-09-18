import { NodeApiProfile } from "@domains/NodeApiProfile";
import type { IApiClients } from "@domains/ApiClientManager";
import type NodeApiAdapter from "@domains/NodeApiAdapter";
export type NetworkId = string;
export type NetworkName = string;
export interface INetworkEndpoints {
    ValidatorURL: string;
    ReadOnlyURL: string;
    IndexerURL: string;
}
export interface INetworkConfig extends INetworkEndpoints {
    nodeApiProfile: NodeApiProfile;
}
export type TNetworksConfig = Record<NetworkName, INetworkConfig>;
export interface INetworkRecord {
    id: NetworkId;
    name: NetworkName;
    config: INetworkConfig;
    isDefault: boolean;
}
export interface IPersistedNetworkRecord {
    id: NetworkId;
    name: NetworkName;
    config: INetworkConfig;
}
export interface INetworkUpdate {
    name?: NetworkName;
    config?: Partial<INetworkConfig>;
}
export type TNetworkBusyListener = (networkId: NetworkId, isBusy: boolean) => void;
export interface INetworkContext {
    networkId: NetworkId;
    name: NetworkName;
    config: INetworkConfig;
    clients: IApiClients;
    api: NodeApiAdapter;
}
export declare const NETWORK_URL_FIELDS: (keyof INetworkEndpoints)[];
export declare const NETWORK_CONFIG_FIELDS: (keyof INetworkConfig)[];
