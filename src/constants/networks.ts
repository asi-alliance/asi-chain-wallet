import {
    DEFAULT_NODE_API_PROFILE,
    INetworkEndpoints,
    isNodeApiProfile,
    NodeApiProfile,
    TNetworksConfig,
} from "@asichain/asi-wallet-sdk";
import { WalletPreferencesStorage } from "services/walletPreferences";
import { Network } from "types/wallet";
import { isNotEmptyPlainObject } from "utils/guards";

type TNetworkEnvEntry = Record<string, unknown>;

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

export const UNCONFIGURED_NETWORK: Network = {
    id: "unconfigured",
    name: "Network is not configured",
    validatorUrl: "",
    observerUrl: "",
    indexerUrl: "",
    nodeApiProfile: DEFAULT_NODE_API_PROFILE,
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

const readEntryString = (
    entry: TNetworkEnvEntry,
    field: string,
    networkId: string,
    issues: INetworksEnvIssue[],
): string | null => {
    const value: unknown = entry[field];

    if (value === undefined || value === null) {
        return "";
    }

    if (typeof value !== "string") {
        issues.push({
            level: "warning",
            networkId,
            message: `${field} must be a string and was ignored: got ${typeof value}`,
        });

        return null;
    }

    return value.trim();
};

const readNetworkUrl = (
    entry: TNetworkEnvEntry,
    field: keyof INetworkEndpoints,
    networkId: string,
    issues: INetworksEnvIssue[],
): string => {
    const url = readEntryString(entry, field, networkId, issues);

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
    const profile = readEntryString(entry, "nodeApiProfile", networkId, issues);

    if (profile === null) {
        return DEFAULT_NODE_API_PROFILE;
    }

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

    let parsedEnv: unknown;

    try {
        parsedEnv = JSON.parse(rawEnv);
    } catch (error) {
        issues.push({
            level: "error",
            message: `NETWORKS is not valid JSON: ${(error as Error).message}`,
        });

        return { networks: [], issues };
    }

    if (!isNotEmptyPlainObject(parsedEnv)) {
        issues.push({
            level: "error",
            message:
                "NETWORKS must be a non-empty JSON object mapping network ids to their configuration",
        });

        return { networks: [], issues };
    }

    const networks: Network[] = [];

    Object.entries(parsedEnv).forEach(([networkId, entry]) => {
        if (!isNotEmptyPlainObject(entry)) {
            issues.push({
                level: "warning",
                networkId,
                message:
                    "skipped: configuration must be a non-empty JSON object",
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
                message: "ReadOnlyURL is missing: reads is unavailable",
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
            name:
                readEntryString(entry, "name", networkId, issues) || networkId,
            validatorUrl,
            observerUrl,
            indexerUrl,
            nodeApiProfile: readNodeApiProfile(entry, networkId, issues),
        });
    });

    const hasCompleteNetwork = networks.some(
        (network: Network) =>
            network.validatorUrl && network.observerUrl && network.indexerUrl,
    );

    if (!hasCompleteNetwork) {
        issues.push({
            level: "error",
            message:
                "NETWORKS contains no fully configured network: at least one entry needs valid http(s) ValidatorURL, ReadOnlyURL and IndexerURL",
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
