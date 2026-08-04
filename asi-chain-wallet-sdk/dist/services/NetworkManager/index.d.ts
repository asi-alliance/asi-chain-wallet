import { INetworkConfig, INetworkRecord, INetworkUpdate, NetworkId, NetworkName, TNetworksConfig } from "@domains/Network";
declare class NetworkManager {
    static initialize: (networksConfig: TNetworksConfig, defaultNetwork?: NetworkName) => Promise<void>;
    static addNetwork: (name: NetworkName, config: INetworkConfig) => Promise<INetworkRecord>;
    static updateNetwork: (id: NetworkId, update: INetworkUpdate) => Promise<void>;
    static removeNetwork: (id: NetworkId) => Promise<void>;
}
export default NetworkManager;
