import { Address, WalletTypes } from "@asichain/asi-wallet-sdk";

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
    validatorUrl: string;
    observerUrl: string;
    indexerUrl: string;
}

export interface WalletStoreState {
    wallets: IWalletMeta[];
    selectedAccountId: string | null;
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
