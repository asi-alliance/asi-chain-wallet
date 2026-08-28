import {
    DEFAULT_NODE_API_PROFILE,
    INetworkEndpoints,
    isNodeApiProfile,
    NodeApiProfile,
    TNetworksConfig,
} from "@asichain/asi-wallet-sdk";
import { Network } from "types/wallet";

type TNetworkEnvEntry = Partial<Record<keyof INetworkEndpoints, string>> & {
    name?: string;
    nodeApiProfile?: string;
};

export interface INetworksEnvIssue {
    level: "error" | "warning";
    networkId?: string;
    message: string;
}

interface INetworksEnvParseResult {
    networks: Network[];
    issues: INetworksEnvIssue[];
}

const ALLOWED_URL_PROTOCOLS = ["http:", "https:"];

export const SELECTED_NETWORK_KEY = "asi_wallet_selected_network";

export const UNCONFIGURED_NETWORK: Network = {
    id: "unconfigured",
    name: "Network is not configured",
    validatorUrl: "",
    observerUrl: "",
    indexerUrl: "",
    nodeApiProfile: DEFAULT_NODE_API_PROFILE,
    isDefault: true,
};

const validateUrl = (url: string): string | null => {
    let parsed: URL;

    try {
        parsed = new URL(url);
    } catch {
        return "is not a valid URL";
    }

    if (!ALLOWED_URL_PROTOCOLS.includes(parsed.protocol)) {
        return "must use http or https protocol";
    }

    if (!parsed.hostname) {
        return "must contain a host";
    }

    return null;
};

const readNetworkUrl = (
    entry: TNetworkEnvEntry,
    field: keyof INetworkEndpoints,
    networkId: string,
    issues: INetworksEnvIssue[],
): string => {
    const url = entry[field]?.trim() ?? "";

    if (!url) {
        return "";
    }

    const error = validateUrl(url);

    if (error) {
        issues.push({
            level: "warning",
            networkId,
            message: `${field} ${error} and was ignored: "${url}"`,
        });

        return "";
    }

    return url;
};

const readNodeApiProfile = (
    entry: TNetworkEnvEntry,
    networkId: string,
    issues: INetworksEnvIssue[],
): NodeApiProfile => {
    const profile = entry.nodeApiProfile?.trim() ?? "";

    if (!profile) {
        issues.push({
            level: "warning",
            networkId,
            message: `nodeApiProfile is missing: falling back to "${DEFAULT_NODE_API_PROFILE}"`,
        });

        return DEFAULT_NODE_API_PROFILE;
    }

    if (!isNodeApiProfile(profile)) {
        issues.push({
            level: "warning",
            networkId,
            message: `nodeApiProfile is not supported and was ignored: "${profile}", falling back to "${DEFAULT_NODE_API_PROFILE}"`,
        });

        return DEFAULT_NODE_API_PROFILE;
    }

    return profile;
};

const parseNetworksEnv = (): INetworksEnvParseResult => {
    const issues: INetworksEnvIssue[] = [];
    const rawEnv = process.env.NETWORKS?.trim();

    if (!rawEnv) {
        issues.push({
            level: "error",
            message: "NETWORKS environment variable is not set",
        });

        return { networks: [], issues };
    }

    let entries: Record<string, TNetworkEnvEntry>;

    try {
        entries = JSON.parse(rawEnv) as Record<string, TNetworkEnvEntry>;
    } catch (error) {
        issues.push({
            level: "error",
            message: `NETWORKS is not valid JSON: ${(error as Error).message}`,
        });

        return { networks: [], issues };
    }

    const networks: Network[] = [];

    Object.entries(entries).forEach(([networkId, entry]) => {
        if (!entry) {
            issues.push({
                level: "warning",
                networkId,
                message: "skipped: configuration is empty",
            });

            return;
        }

        const validatorUrl = readNetworkUrl(
            entry,
            "ValidatorURL",
            networkId,
            issues,
        );

        if (!validatorUrl) {
            issues.push({
                level: "warning",
                networkId,
                message: "skipped: ValidatorURL is missing or invalid",
            });

            return;
        }

        const observerUrl = readNetworkUrl(
            entry,
            "ReadOnlyURL",
            networkId,
            issues,
        );

        if (!observerUrl) {
            issues.push({
                level: "warning",
                networkId,
                message:
                    "ReadOnlyURL is missing: reads will go to the validator",
            });
        }

        const indexerUrl = readNetworkUrl(
            entry,
            "IndexerURL",
            networkId,
            issues,
        );

        if (!indexerUrl) {
            issues.push({
                level: "warning",
                networkId,
                message:
                    "IndexerURL is missing: transaction history is unavailable",
            });
        }

        networks.push({
            id: networkId,
            name: entry.name?.trim() || networkId,
            validatorUrl,
            observerUrl,
            indexerUrl,
            nodeApiProfile: readNodeApiProfile(entry, networkId, issues),
            isDefault: true,
        });
    });

    if (!networks.length) {
        issues.push({
            level: "error",
            message:
                "NETWORKS contains no usable network: every entry needs a valid http(s) ValidatorURL",
        });
    }

    return { networks, issues };
};

const { networks, issues } = parseNetworksEnv();

export const NETWORKS: Network[] = networks;

export const NETWORKS_ENV_ISSUES: INetworksEnvIssue[] = issues;

const buildNetworksConfig = (): TNetworksConfig => {
    const config: TNetworksConfig = {};

    NETWORKS.forEach((network: Network) => {
        config[network.id] = {
            ValidatorURL: network.validatorUrl,
            ReadOnlyURL: network.observerUrl,
            IndexerURL: network.indexerUrl,
            nodeApiProfile: network.nodeApiProfile,
        };
    });

    return config;
};

export const NETWORKS_CONFIG: TNetworksConfig = buildNetworksConfig();

export const getNetworksEnvError = (): string | null => {
    const errors = NETWORKS_ENV_ISSUES.filter(
        (issue: INetworksEnvIssue) => issue.level === "error",
    );

    if (!errors.length) {
        return null;
    }

    return errors.map((issue: INetworksEnvIssue) => issue.message).join("; ");
};

const readSelectedNetworkId = (): string | null => {
    try {
        return localStorage.getItem(SELECTED_NETWORK_KEY);
    } catch (error) {
        console.error("Failed to read selected network id:", error);

        return null;
    }
};

export const persistSelectedNetworkId = (networkId: string): void => {
    try {
        localStorage.setItem(SELECTED_NETWORK_KEY, networkId);
    } catch (error) {
        console.error("Failed to persist selected network id:", error);
    }
};

export const getInitialNetwork = (): Network => {
    if (!NETWORKS.length) {
        return UNCONFIGURED_NETWORK;
    }

    const selectedNetworkId = readSelectedNetworkId();

    return (
        NETWORKS.find((network: Network) => network.id === selectedNetworkId) ??
        NETWORKS[0]
    );
};

NETWORKS_ENV_ISSUES.forEach(
    ({ level, networkId, message }: INetworksEnvIssue) => {
        const scope = networkId ? ` "${networkId}"` : "";
        const text = `[NETWORKS env]${scope} ${message}`;

        if (level === "error") {
            console.error(text);

            return;
        }

        console.warn(text);
    },
);
