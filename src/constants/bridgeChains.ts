import { sepolia, baseSepolia } from "viem/chains";
import { CARDANO_TOKEN_DECIMALS } from "utils/tokenFormat";
import { ASI_DECIMALS } from "@asichain/asi-wallet-sdk";
import { getBridgeConfiguration } from "config/bridgeFeature";

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
    koiosUrl?: string;
}

const SEPOLIA_ROUTE_ID = sepolia.id;
const BASE_SEPOLIA_ROUTE_ID = baseSepolia.id;

const { asi, fetchhubDorado, cardanoPreprod } = getBridgeConfiguration();

export const ASI_BRIDGE_URI = asi.bridgeUri;

export const BRIDGE_CHAINS: BridgeChainConfig[] = [
    {
        key: "asi",
        kind: "asi",
        label: "ASI Chain",
        shortLabel: "ASI",
        routeId: asi.routeId,
        nativeDecimals: ASI_DECIMALS,
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
        routeId: fetchhubDorado.routeId,
        nativeDecimals: 18,
        addressPrefix: "fetch",
        bridgeAddress: fetchhubDorado.bridgeAddress,
        cosmosChainId: fetchhubDorado.chainId,
        rpcUrl: fetchhubDorado.rpcUrl,
        restUrl: fetchhubDorado.restUrl,
        denom: fetchhubDorado.denom,
        displayDenom: "TESTFET",
    },
    {
        key: "cardanoPreprod",
        kind: "cardano",
        label: "Cardano Preprod",
        shortLabel: "Cardano",
        routeId: cardanoPreprod.routeId,
        nativeDecimals: CARDANO_TOKEN_DECIMALS,
        cardanoNetworkId: cardanoPreprod.networkId,
        networkMagic: cardanoPreprod.networkMagic,
        bridgeAddress: cardanoPreprod.bridgeAddress,
        assetPolicyId: cardanoPreprod.assetPolicyId,
        assetName: cardanoPreprod.assetName,
        koiosUrl: cardanoPreprod.koiosUrl,
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
