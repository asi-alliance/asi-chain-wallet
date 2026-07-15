import {
    INetworkConfig,
    NetworkName,
    TNetworksConfig,
} from "@asichain/asi-wallet-sdk";
import { Network } from "types/wallet";
import { parseNetworksFromEnv } from "store/WalletsStore/walletsStoreSlice";

const NETWORK_NAMES: NetworkName[] = ["Dev", "DevNet", "TestNet", "MainNet"];

const createEmptyNetworkConfig = (): INetworkConfig => ({
    ValidatorURL: "",
    ReadOnlyURL: "",
    IndexerURL: "",
});

const toNetworkName = (network: Network): NetworkName | null =>
    NETWORK_NAMES.find(
        (name) =>
            name.toLowerCase() === network.id ||
            name.toLowerCase() === network.name.toLowerCase(),
    ) ?? null;

const buildNetworksConfig = (): TNetworksConfig => {
    const config: TNetworksConfig = {
        Dev: createEmptyNetworkConfig(),
        DevNet: createEmptyNetworkConfig(),
        TestNet: createEmptyNetworkConfig(),
        MainNet: createEmptyNetworkConfig(),
    };

    parseNetworksFromEnv().forEach((network) => {
        const networkName = toNetworkName(network);

        if (!networkName) {
            return;
        }

        config[networkName] = {
            ValidatorURL: network.url,
            ReadOnlyURL: network.readOnlyUrl ?? "",
            IndexerURL: network.graphqlUrl ?? "",
        };
    });

    return config;
};

export const NETWORKS_CONFIG: TNetworksConfig = buildNetworksConfig();

export const DEFAULT_NETWORK: NetworkName = "DevNet";
