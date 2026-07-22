import { sepolia, baseSepolia } from "viem/chains";
import { ASI_CHAIN_DECIMALS, CARDANO_TOKEN_DECIMALS } from "utils/tokenFormat";

export type BridgeChainKey =
    | "asi"
    | "sepolia"
    | "baseSepolia"
    | "fetchhubDorado"
    | "cardanoPreprod";

export type BridgeChainKind = "asi" | "evm" | "cosmos" | "cardano";

export interface BridgeChainConfig {
    key: BridgeChainKey;
    kind: BridgeChainKind;
    label: string;
    shortLabel: string;
    routeId: number;
    nativeDecimals: number;
    addressPrefix?: string;
    bridgeUri?: string;
    bridgeAddress?: string;
    evmId?: number;
    cosmosChainId?: string;
    rpcUrl?: string;
    restUrl?: string;
    denom?: string;
    displayDenom?: string;
    cardanoNetworkId?: string;
    networkMagic?: number;
    assetPolicyId?: string;
    assetName?: string;
}

export const envStr = (key: string): string => {
    if (!process.env[key]) {
        throw new Error(`Env variable with key ${key} not found`);
    }

    return process.env[key];
};
export const envNum = (key: string): number => {
    if (!process.env[key]) {
        throw new Error(`Env variable with key ${key} not found`);
    }

    return Number(process.env[key]);
};

const SEPOLIA_ROUTE_ID = sepolia.id;
const BASE_SEPOLIA_ROUTE_ID = baseSepolia.id;

export const ASI_BRIDGE_URI = envStr("REACT_APP_ASI_BRIDGE_URI");

const ASI_ROUTE_ID = envNum("REACT_APP_ASI_CHAIN_ID");
const FETCHHUB_DORADO_ROUTE_ID = envNum("REACT_APP_FETCHHUB_DORADO_ROUTE_ID");
const CARDANO_PREPROD_ROUTE_ID = envNum("REACT_APP_CARDANO_PREPROD_ROUTE_ID");

const FETCHHUB_DORADO_BRIDGE_ADDRESS = envStr(
    "REACT_APP_FETCHHUB_DORADO_BRIDGE_ADDRESS",
);
const FETCHHUB_DORADO_CHAIN_ID = envStr("REACT_APP_FETCHHUB_DORADO_CHAIN_ID");
const FETCHHUB_DORADO_RPC_URL = envStr("REACT_APP_FETCHHUB_DORADO_RPC_URL");
const FETCHHUB_DORADO_REST_URL = envStr("REACT_APP_FETCHHUB_DORADO_REST_URL");
const FETCHHUB_DORADO_DENOM = envStr("REACT_APP_FETCHHUB_DORADO_DENOM");
const CARDANO_PREPROD_BRIDGE_ADDRESS = envStr(
    "REACT_APP_CARDANO_PREPROD_BRIDGE_ADDRESS",
);
const CARDANO_PREPROD_POLICY_ID = envStr("REACT_APP_CARDANO_PREPROD_POLICY_ID");
const CARDANO_PREPROD_ASSET_NAME = envStr(
    "REACT_APP_CARDANO_PREPROD_ASSET_NAME",
);
const CARDANO_PREPROD_NETWORK_ID = envStr(
    "REACT_APP_CARDANO_PREPROD_NETWORK_ID",
);
const CARDANO_PREPROD_NETWORK_MAGIC = envNum(
    "REACT_APP_CARDANO_PREPROD_NETWORK_MAGIC",
);

export const BRIDGE_CHAINS: BridgeChainConfig[] = [
    {
        key: "asi",
        kind: "asi",
        label: "ASI Chain",
        shortLabel: "ASI",
        routeId: ASI_ROUTE_ID,
        nativeDecimals: ASI_CHAIN_DECIMALS,
        bridgeUri: ASI_BRIDGE_URI,
    },
    {
        key: "sepolia",
        kind: "evm",
        label: "Sepolia",
        shortLabel: "Sepolia",
        routeId: SEPOLIA_ROUTE_ID,
        nativeDecimals: 18,
        evmId: SEPOLIA_ROUTE_ID,
    },
    {
        key: "baseSepolia",
        kind: "evm",
        label: "Base Sepolia",
        shortLabel: "Base",
        routeId: BASE_SEPOLIA_ROUTE_ID,
        nativeDecimals: 18,
        evmId: BASE_SEPOLIA_ROUTE_ID,
    },
    {
        key: "fetchhubDorado",
        kind: "cosmos",
        label: "FetchHub Dorado",
        shortLabel: "Dorado",
        routeId: FETCHHUB_DORADO_ROUTE_ID,
        nativeDecimals: 18,
        addressPrefix: "fetch",
        bridgeAddress: FETCHHUB_DORADO_BRIDGE_ADDRESS,
        cosmosChainId: FETCHHUB_DORADO_CHAIN_ID,
        rpcUrl: FETCHHUB_DORADO_RPC_URL,
        restUrl: FETCHHUB_DORADO_REST_URL,
        denom: FETCHHUB_DORADO_DENOM,
        displayDenom: "TESTFET",
    },
    {
        key: "cardanoPreprod",
        kind: "cardano",
        label: "Cardano Preprod",
        shortLabel: "Cardano",
        routeId: CARDANO_PREPROD_ROUTE_ID,
        nativeDecimals: CARDANO_TOKEN_DECIMALS,
        cardanoNetworkId: CARDANO_PREPROD_NETWORK_ID,
        networkMagic: CARDANO_PREPROD_NETWORK_MAGIC,
        bridgeAddress: CARDANO_PREPROD_BRIDGE_ADDRESS,
        assetPolicyId: CARDANO_PREPROD_POLICY_ID,
        assetName: CARDANO_PREPROD_ASSET_NAME,
    },
];

export const SOURCE_CHAIN_KEYS: BridgeChainKey[] = [
    "asi",
    "sepolia",
    "baseSepolia",
    "fetchhubDorado",
    "cardanoPreprod",
];

export const DESTINATION_CHAIN_KEYS: BridgeChainKey[] = [
    "asi",
    "sepolia",
    "baseSepolia",
    "fetchhubDorado",
    "cardanoPreprod",
];

export const bridgeChainForKey = (key: BridgeChainKey): BridgeChainConfig =>
    BRIDGE_CHAINS.find((chain) => chain.key === key) ?? BRIDGE_CHAINS[0];

export const defaultDestinationFor = (source: BridgeChainKey): BridgeChainKey =>
    DESTINATION_CHAIN_KEYS.find((key) => key !== source) ?? "asi";
