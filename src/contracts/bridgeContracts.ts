import { getBridgeConfiguration } from "config/bridgeFeature";
import { sepolia, baseSepolia } from "viem/chains";

type Addr = `0x${string}`;

interface ContractSet {
    bridge: Addr;
    token: Addr;
}

const { sepolia: sepoliaContracts, baseSepolia: baseSepoliaContracts } =
    getBridgeConfiguration();

const CONTRACTS_BY_CHAIN: Record<number, ContractSet> = {
    [sepolia.id]: {
        bridge: sepoliaContracts.bridge as Addr,
        token: sepoliaContracts.token as Addr,
    },
    [baseSepolia.id]: {
        bridge: baseSepoliaContracts.bridge as Addr,
        token: baseSepoliaContracts.token as Addr,
    },
};

export const contractsForChain = (chainId: number | undefined): ContractSet =>
    CONTRACTS_BY_CHAIN[chainId ?? sepolia.id] ?? CONTRACTS_BY_CHAIN[sepolia.id];

export const BridgeABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "user",
                type: "address",
            },
            {
                indexed: false,
                internalType: "string",
                name: "recipient",
                type: "string",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
            {
                indexed: true,
                internalType: "bytes32",
                name: "txHash",
                type: "bytes32",
            },
            {
                indexed: true,
                internalType: "uint256",
                name: "nonce",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "destChainId",
                type: "uint256",
            },
        ],
        name: "Locked",
        type: "event",
    },
    {
        inputs: [
            { internalType: "uint256", name: "amount", type: "uint256" },
            { internalType: "string", name: "recipient", type: "string" },
            { internalType: "uint256", name: "destChainId", type: "uint256" },
        ],
        name: "lock",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "totalLocked",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "token",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
] as const;

export const TokenABI = [
    {
        inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "value", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "symbol",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
] as const;
