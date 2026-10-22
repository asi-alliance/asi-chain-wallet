import {
    DEFAULT_NODE_API_PROFILE,
    TNetworksConfig,
} from "@asichain/asi-wallet-sdk";
import {
    formatNetworksEnvIssue,
    getNetworksEnvErrorMessage,
    INetworksEnvIssue,
    parseNetworksEnv,
} from "config/networksEnv";
import { SdkWalletService } from "sdk/SdkWalletService";
import { WalletPreferencesStorage } from "services/walletPreferences";
import { Network } from "types/wallet";

export const UNCONFIGURED_NETWORK: Network = {
    id: "unconfigured",
    name: "Network is not configured",
    validatorUrl: "",
    observerUrl: "",
    indexerUrl: "",
    nodeApiProfile: DEFAULT_NODE_API_PROFILE,
    isDefault: true,
};

const { networks, issues } = parseNetworksEnv(process.env.NETWORKS);

export const NETWORKS: Network[] = networks;

export const NETWORKS_ENV_ISSUES: INetworksEnvIssue[] = issues;

const buildNetworksConfig = (): TNetworksConfig => {
    const config: TNetworksConfig = {};

    NETWORKS.forEach((network: Network) => {
        config[network.id] = SdkWalletService.toNetworkConfig(network);
    });

    return config;
};

export const NETWORKS_CONFIG: TNetworksConfig = buildNetworksConfig();

export const getNetworksEnvError = (): string | null =>
    getNetworksEnvErrorMessage(NETWORKS_ENV_ISSUES);

export const getInitialNetwork = (): Network => {
    if (!NETWORKS.length) {
        return UNCONFIGURED_NETWORK;
    }

    const selectedNetworkId = WalletPreferencesStorage.getSelectedNetworkId();

    return (
        NETWORKS.find((network: Network) => network.id === selectedNetworkId) ??
        NETWORKS[0]
    );
};

NETWORKS_ENV_ISSUES.forEach((issue: INetworksEnvIssue) => {
    const text = formatNetworksEnvIssue(issue);

    if (issue.level === "error") {
        console.error(text);

        return;
    }

    console.warn(text);
});