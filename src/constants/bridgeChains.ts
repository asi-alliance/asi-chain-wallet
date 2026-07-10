import {
    ASI_CHAIN_DECIMALS,
    CARDANO_TOKEN_DECIMALS,
} from "utils/tokenFormat";

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

const env = (key: string, fallback: string): string =>
    process.env[key] ?? fallback;

const SEPOLIA_ROUTE_ID = 11155111;
const BASE_SEPOLIA_ROUTE_ID = 84532;

export const ASI_BRIDGE_URI = env(
    "REACT_APP_ASI_BRIDGE_URI",
    "rho:id:9j876bswk1dd99m7657ianiow4tgxj33r3oaq9rqyxj1cbzox6cdth",
);

const ASI_ROUTE_ID = Number(env("REACT_APP_ASI_CHAIN_ID", "0"));
const FETCHHUB_DORADO_ROUTE_ID = Number(
    env("REACT_APP_FETCHHUB_DORADO_ROUTE_ID", "4361"),
);
const CARDANO_PREPROD_ROUTE_ID = Number(
    env("REACT_APP_CARDANO_PREPROD_ROUTE_ID", "181501"),
);

const FETCHHUB_DORADO_BRIDGE_ADDRESS = env(
    "REACT_APP_FETCHHUB_DORADO_BRIDGE_ADDRESS",
    "fetch133z0cwzwmrmmck3c0jgg9g3lfk2gqnkvgyjcnqlxa655xqpyxldszczv8t",
);
const FETCHHUB_DORADO_CHAIN_ID = env(
    "REACT_APP_FETCHHUB_DORADO_CHAIN_ID",
    "dorado-1",
);
const FETCHHUB_DORADO_RPC_URL = env(
    "REACT_APP_FETCHHUB_DORADO_RPC_URL",
    "https://rpc-dorado.fetch.ai:443",
);
const FETCHHUB_DORADO_REST_URL = env(
    "REACT_APP_FETCHHUB_DORADO_REST_URL",
    "https://rest-dorado.fetch.ai:443",
);
const FETCHHUB_DORADO_DENOM = env(
    "REACT_APP_FETCHHUB_DORADO_DENOM",
    "atestfet",
);
const CARDANO_PREPROD_BRIDGE_ADDRESS = env(
    "REACT_APP_CARDANO_PREPROD_BRIDGE_ADDRESS",
    "addr_test1wpa3uz0pr7ysg64pvz2hdr5g20s5ruwt3zgf3dxk8qpkjjc5xcrsg",
);
const CARDANO_PREPROD_POLICY_ID = env(
    "REACT_APP_CARDANO_PREPROD_POLICY_ID",
    "def68337867cb4f1f95b6b811fedbfcdd7780d10a95cc072077088ea",
);
const CARDANO_PREPROD_ASSET_NAME = env(
    "REACT_APP_CARDANO_PREPROD_ASSET_NAME",
    "415349",
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
        cardanoNetworkId: "preprod",
        networkMagic: 1,
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

export const defaultDestinationFor = (
    source: BridgeChainKey,
): BridgeChainKey =>
    DESTINATION_CHAIN_KEYS.find((key) => key !== source) ?? "asi";
