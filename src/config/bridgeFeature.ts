/**
 * Bridge is an opt-in build feature.
 *
 * `REACT_APP_BRIDGE_ENABLED` turns it on. Every other bridge variable is read
 * only after the flag is on, and all problems are collected instead of thrown
 * so `/bridge` can list them and the other wallet routes keep working.
 *
 * This module must stay free of browser-only imports: it is part of the main
 * bundle, and a wallet-only build must not pull wagmi, CosmJS or Mesh into it.
 */

export interface AsiBridgeConfiguration {
    bridgeUri: string;
    routeId: number;
}

export interface EvmBridgeConfiguration {
    bridge: string;
    token: string;
}

export interface FetchHubBridgeConfiguration {
    routeId: number;
    chainId: string;
    bridgeAddress: string;
    denom: string;
    rpcUrl: string;
    restUrl: string;
}

export interface CardanoBridgeConfiguration {
    routeId: number;
    networkId: string;
    networkMagic: number;
    bridgeAddress: string;
    assetPolicyId: string;
    assetName: string;
    koiosUrl: string;
}

export interface BridgeConfiguration {
    asi: AsiBridgeConfiguration;
    sepolia: EvmBridgeConfiguration;
    baseSepolia: EvmBridgeConfiguration;
    fetchhubDorado: FetchHubBridgeConfiguration;
    cardanoPreprod: CardanoBridgeConfiguration;
}

export type BridgeFeature =
    | { status: "disabled" }
    | { status: "invalid"; issues: string[] }
    | { status: "ready"; config: BridgeConfiguration };

const TRUE_FLAG_VALUES = new Set(["true", "1", "yes"]);
const FALSE_FLAG_VALUES = new Set(["false", "0", "no"]);

export const BRIDGE_ENV_KEYS = [
    "REACT_APP_ASI_BRIDGE_URI",
    "REACT_APP_ASI_CHAIN_ID",
    "REACT_APP_SEPOLIA_BRIDGE_ADDRESS",
    "REACT_APP_SEPOLIA_TOKEN_ADDRESS",
    "REACT_APP_BASE_SEPOLIA_BRIDGE_ADDRESS",
    "REACT_APP_BASE_SEPOLIA_TOKEN_ADDRESS",
    "REACT_APP_FETCHHUB_DORADO_ROUTE_ID",
    "REACT_APP_FETCHHUB_DORADO_CHAIN_ID",
    "REACT_APP_FETCHHUB_DORADO_BRIDGE_ADDRESS",
    "REACT_APP_FETCHHUB_DORADO_DENOM",
    "REACT_APP_FETCHHUB_DORADO_RPC_URL",
    "REACT_APP_FETCHHUB_DORADO_REST_URL",
    "REACT_APP_CARDANO_PREPROD_ROUTE_ID",
    "REACT_APP_CARDANO_PREPROD_NETWORK_ID",
    "REACT_APP_CARDANO_PREPROD_NETWORK_MAGIC",
    "REACT_APP_CARDANO_PREPROD_BRIDGE_ADDRESS",
    "REACT_APP_CARDANO_PREPROD_POLICY_ID",
    "REACT_APP_CARDANO_PREPROD_ASSET_NAME",
    "REACT_APP_CARDANO_PREPROD_KOIOS_URL",
] as const;

const setMessage = (key: string, expectation: string): string =>
    `Set ${key} to ${expectation} to enable Bridge.`;

const trimmed = (env: NodeJS.ProcessEnv, key: string): string =>
    env[key]?.trim() ?? "";

const parseRhoUri = (value: string): string | null =>
    /^rho:id:[0-9a-z]+$/i.test(value) ? value : null;

const parseHttpUrl = (value: string): string | null => {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:"
            ? value
            : null;
    } catch {
        return null;
    }
};

// A shape check is enough here: importing viem into this module would add it
// to the main bundle of wallet-only builds.
const parseEvmAddress = (value: string): string | null =>
    /^0x[0-9a-f]{40}$/i.test(value) ? value : null;

const parsePositiveInteger = (value: string): number | null => {
    if (!/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseNonNegativeInteger = (value: string): number | null => {
    if (!/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
};

const parseFetchAddress = (value: string): string | null =>
    /^fetch1[0-9a-z]+$/i.test(value) ? value : null;

const parseCardanoPreprodAddress = (value: string): string | null =>
    /^addr_test1[0-9a-z]+$/i.test(value) ? value : null;

const parsePolicyId = (value: string): string | null =>
    /^[0-9a-f]{56}$/i.test(value) ? value : null;

const parseAssetName = (value: string): string | null =>
    /^([0-9a-f]{2})+$/i.test(value) ? value : null;

const parseNonEmpty = (value: string): string | null => value;

type Reader = <T>(
    key: string,
    expectation: string,
    parse: (value: string) => T | null,
) => T;

const createReader = (
    env: NodeJS.ProcessEnv,
    issues: string[],
): Reader => {
    return <T>(
        key: string,
        expectation: string,
        parse: (value: string) => T | null,
    ): T => {
        const raw = trimmed(env, key);
        const parsed = raw ? parse(raw) : null;
        if (parsed === null) {
            issues.push(setMessage(key, expectation));
            return undefined as T;
        }
        return parsed;
    };
};

const readBridgeConfiguration = (
    env: NodeJS.ProcessEnv,
): { config: BridgeConfiguration; issues: string[] } => {
    const issues: string[] = [];
    const read = createReader(env, issues);

    const config: BridgeConfiguration = {
        asi: {
            bridgeUri: read(
                "REACT_APP_ASI_BRIDGE_URI",
                "a rho:id:... URI",
                parseRhoUri,
            ),
            routeId: read(
                "REACT_APP_ASI_CHAIN_ID",
                "a non-negative integer route id",
                parseNonNegativeInteger,
            ),
        },
        sepolia: {
            bridge: read(
                "REACT_APP_SEPOLIA_BRIDGE_ADDRESS",
                "a 0x-prefixed 20-byte address",
                parseEvmAddress,
            ),
            token: read(
                "REACT_APP_SEPOLIA_TOKEN_ADDRESS",
                "a 0x-prefixed 20-byte address",
                parseEvmAddress,
            ),
        },
        baseSepolia: {
            bridge: read(
                "REACT_APP_BASE_SEPOLIA_BRIDGE_ADDRESS",
                "a 0x-prefixed 20-byte address",
                parseEvmAddress,
            ),
            token: read(
                "REACT_APP_BASE_SEPOLIA_TOKEN_ADDRESS",
                "a 0x-prefixed 20-byte address",
                parseEvmAddress,
            ),
        },
        fetchhubDorado: {
            routeId: read(
                "REACT_APP_FETCHHUB_DORADO_ROUTE_ID",
                "a positive integer route id",
                parsePositiveInteger,
            ),
            chainId: read(
                "REACT_APP_FETCHHUB_DORADO_CHAIN_ID",
                "a Cosmos chain id such as dorado-1",
                parseNonEmpty,
            ),
            bridgeAddress: read(
                "REACT_APP_FETCHHUB_DORADO_BRIDGE_ADDRESS",
                "a fetch1... address",
                parseFetchAddress,
            ),
            denom: read(
                "REACT_APP_FETCHHUB_DORADO_DENOM",
                "a non-empty denom such as atestfet",
                parseNonEmpty,
            ),
            rpcUrl: read(
                "REACT_APP_FETCHHUB_DORADO_RPC_URL",
                "an http(s) URL",
                parseHttpUrl,
            ),
            restUrl: read(
                "REACT_APP_FETCHHUB_DORADO_REST_URL",
                "an http(s) URL",
                parseHttpUrl,
            ),
        },
        cardanoPreprod: {
            routeId: read(
                "REACT_APP_CARDANO_PREPROD_ROUTE_ID",
                "a positive integer route id",
                parsePositiveInteger,
            ),
            networkId: read(
                "REACT_APP_CARDANO_PREPROD_NETWORK_ID",
                "a Cardano network name such as preprod",
                parseNonEmpty,
            ),
            networkMagic: read(
                "REACT_APP_CARDANO_PREPROD_NETWORK_MAGIC",
                "a non-negative integer network magic",
                parseNonNegativeInteger,
            ),
            bridgeAddress: read(
                "REACT_APP_CARDANO_PREPROD_BRIDGE_ADDRESS",
                "a Preprod address starting with addr_test1",
                parseCardanoPreprodAddress,
            ),
            assetPolicyId: read(
                "REACT_APP_CARDANO_PREPROD_POLICY_ID",
                "a 56-character hex policy id",
                parsePolicyId,
            ),
            assetName: read(
                "REACT_APP_CARDANO_PREPROD_ASSET_NAME",
                "a hex-encoded asset name",
                parseAssetName,
            ),
            koiosUrl: read(
                "REACT_APP_CARDANO_PREPROD_KOIOS_URL",
                "an http(s) URL",
                parseHttpUrl,
            ),
        },
    };

    return { config, issues };
};

const resolveBridgeFlag = (
    env: NodeJS.ProcessEnv,
): { enabled: boolean; issues: string[] } => {
    const raw = trimmed(env, "REACT_APP_BRIDGE_ENABLED");
    const flag = raw.toLowerCase();
    if (!flag || FALSE_FLAG_VALUES.has(flag)) {
        return { enabled: false, issues: [] };
    }
    if (TRUE_FLAG_VALUES.has(flag)) {
        return { enabled: true, issues: [] };
    }
    return {
        enabled: false,
        issues: [
            `Set REACT_APP_BRIDGE_ENABLED to true, 1 or yes to enable Bridge, or to false, 0 or no to keep it off. Received "${raw}".`,
        ],
    };
};

export const resolveBridgeFeature = (
    env: NodeJS.ProcessEnv,
): BridgeFeature => {
    const flag = resolveBridgeFlag(env);
    if (flag.issues.length > 0) {
        return { status: "invalid", issues: flag.issues };
    }
    if (!flag.enabled) {
        return { status: "disabled" };
    }

    const { config, issues } = readBridgeConfiguration(env);
    if (issues.length > 0) {
        return { status: "invalid", issues };
    }
    return { status: "ready", config };
};

export const bridgeFeature = resolveBridgeFeature(process.env);

export const bridgeFeatureWarnings = (
    feature: BridgeFeature,
    env: NodeJS.ProcessEnv,
): string[] => {
    if (feature.status !== "disabled") {
        return [];
    }
    const configured = BRIDGE_ENV_KEYS.filter((key) => trimmed(env, key));
    if (configured.length === 0) {
        return [];
    }
    return [
        `Bridge variables are set (${configured.join(
            ", ",
        )}) but REACT_APP_BRIDGE_ENABLED is off, so Bridge stays hidden.`,
    ];
};

export const logBridgeFeatureState = (
    feature: BridgeFeature = bridgeFeature,
    env: NodeJS.ProcessEnv = process.env,
): void => {
    if (feature.status === "invalid") {
        console.error("[bridge] Bridge is unavailable:");
        feature.issues.forEach((issue) => console.error(`[bridge] ${issue}`));
    }
    bridgeFeatureWarnings(feature, env).forEach((warning) =>
        console.warn(`[bridge] ${warning}`),
    );
};

export const getBridgeConfiguration = (
    feature: BridgeFeature = bridgeFeature,
): BridgeConfiguration => {
    if (feature.status !== "ready") {
        const reason =
            feature.status === "invalid"
                ? feature.issues.join(" ")
                : "REACT_APP_BRIDGE_ENABLED is off.";
        throw new Error(
            `Bridge must be configured before loading its integrations. ${reason}`,
        );
    }
    return feature.config;
};
