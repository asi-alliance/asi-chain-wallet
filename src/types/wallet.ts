import { Address, WalletTypes } from "@asichain/asi-wallet-sdk";
import { Transaction } from "./transactions";

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
    isInitialLoadComplete: boolean;
}

export interface IAccountMeta {
    id: string;
    name: string;
    index: number | null;
    address: Address;
    publicKey: string;
}

export interface IWalletMeta {
    id?: string;
    signerId: string;
    isUnlocked: boolean;
    type: WalletTypes;
    accounts: IAccountMeta[];
}

export enum WalletActions {
    CREATE_WALLET = "create-wallet",
}
