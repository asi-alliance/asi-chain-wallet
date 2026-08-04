export type NetworkId = string;
export type NetworkName = string;
export interface INetworkConfig {
    ValidatorURL: string;
    ReadOnlyURL: string;
    IndexerURL: string;
}
export type TNetworksConfig = Record<NetworkName, INetworkConfig>;
export interface INetworkRecord {
    id: NetworkId;
    name: NetworkName;
    config: INetworkConfig;
    isDefault: boolean;
}
export interface INetworkUpdate {
    name?: NetworkName;
    config?: Partial<INetworkConfig>;
}
