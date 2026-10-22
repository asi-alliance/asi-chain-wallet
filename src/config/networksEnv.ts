import {
    DEFAULT_NODE_API_PROFILE,
    INetworkEndpoints,
    isNodeApiProfile,
    isSameNetworkConfig,
    NodeApiProfile,
} from "@asichain/asi-wallet-sdk";
import { SdkWalletService } from "../sdk/SdkWalletService";
import type { Network } from "../types/wallet";
import { isNotEmptyPlainObject } from "../utils/guards";

type TNetworkEnvEntry = Record<string, unknown>;

export interface INetworksEnvIssue {
    level: "error" | "warning";
    networkId?: string;
    message: string;
}

export interface INetworksEnvParseResult {
    networks: Network[];
    issues: INetworksEnvIssue[];
}

const ALLOWED_URL_PROTOCOLS = ["http:", "https:"];

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

const isSameNetworkEndpoints = (first: Network, second: Network): boolean =>
    isSameNetworkConfig(
        SdkWalletService.toNetworkConfig(first),
        SdkWalletService.toNetworkConfig(second),
    );

const isSameNetworkName = (first: Network, second: Network): boolean =>
    first.name.toLowerCase() === second.name.toLowerCase();

const findDuplicateNetworkGroups = (
    networks: Network[],
    isDuplicate: (first: Network, second: Network) => boolean,
): Network[][] => {
    const groups: Network[][] = [];

    networks.forEach((network: Network) => {
        const group = groups.find(([groupNetwork]: Network[]) =>
            isDuplicate(groupNetwork, network),
        );

        if (group) {
            group.push(network);

            return;
        }

        groups.push([network]);
    });

    return groups.filter((group: Network[]) => group.length > 1);
};

const formatNetworkIds = (group: Network[]): string =>
    group.map(({ id }: Network) => `"${id}"`).join(", ");

const validateNetworksUniqueness = (
    networks: Network[],
    issues: INetworksEnvIssue[],
): void => {
    findDuplicateNetworkGroups(networks, isSameNetworkEndpoints).forEach(
        (group: Network[]) => {
            issues.push({
                level: "error",
                message: `NETWORKS contains networks with the same URLs and nodeApiProfile: ${formatNetworkIds(group)}`,
            });
        },
    );

    findDuplicateNetworkGroups(networks, isSameNetworkName).forEach(
        (group: Network[]) => {
            issues.push({
                level: "error",
                message: `NETWORKS contains networks with the same name "${group[0].name}": ${formatNetworkIds(group)}`,
            });
        },
    );
};

export const parseNetworksEnv = (
    networksEnv: string | undefined,
): INetworksEnvParseResult => {
    const issues: INetworksEnvIssue[] = [];
    const rawEnv = networksEnv?.trim();

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
            isDefault: true,
        });
    });

    validateNetworksUniqueness(networks, issues);

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

export const getNetworksEnvErrorMessage = (
    issues: INetworksEnvIssue[],
): string | null => {
    const errors = issues.filter(
        (issue: INetworksEnvIssue) => issue.level === "error",
    );

    if (!errors.length) {
        return null;
    }

    return errors.map((issue: INetworksEnvIssue) => issue.message).join("; ");
};

export const formatNetworksEnvIssue = ({
    networkId,
    message,
}: INetworksEnvIssue): string => {
    const scope = networkId ? ` "${networkId}"` : "";

    return `[NETWORKS env]${scope} ${message}`;
};