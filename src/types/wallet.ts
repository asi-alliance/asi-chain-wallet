import { WalletTypes } from "@asichain/asi-wallet-sdk";

export interface Account {
    id: string;
    name: string;
    address: string;
    revAddress: string;
    ethAddress: string;
    publicKey: string;
    privateKey?: string;
    balance: string;
    isMetamask?: boolean;
    networkId?: string;
    createdAt: Date;
}

export interface Transaction {
    id: string;
    deployId: string;
    from: string;
    to: string;
    amount: string;
    timestamp: string;
    status: "pending" | "completed" | "failed";
    blockNumber?: number;
    error?: string;
    gasCost?: string;
}

export interface Deploy {
    term: string;
    phloLimit: number;
    phloPrice: number;
    validAfterBlockNumber: number;
    timestamp: number;
}

export interface Network {
    id: string;
    name: string;
    url: string;
    readOnlyUrl?: string;
    adminUrl?: string;
    graphqlUrl?: string;
    shardId?: string;
}

export interface WalletStoreState {
    wallets: IWalletMeta[];
    balances: Record<string, string>;
    selectedAccountId: string | null;
    transactions: Transaction[];
    networks: Network[];
    selectedNetwork: Network;
    isLoading: boolean;
    error: string | null;
}

export interface IAccountMeta {
    id: string;
    name: string;
    index: number | null;
    address: string;
}

export interface IWalletMeta {
    id?: string;
    signerId: string;
    isUnlocked: boolean;
    type: WalletTypes;
    accounts: IAccountMeta[];
}
