import {
    Address,
    INetworkRecord,
    NodeApiProfile,
    WalletTypes,
} from "@asichain/asi-wallet-sdk";

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
    nodeApiProfile: NodeApiProfile;
    isDefault: boolean;
}

export type TCustomNetworkRecord = Omit<INetworkRecord, "isDefault"> & {
    isDefault: false;
};

export type TCustomNetwork = Omit<Network, "isDefault"> & {
    isDefault: false;
};

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
}

export interface IUnlockedAccountMeta extends IAccountMeta {
    address: Address;
    publicKey: string;
}

interface IWalletMetaBase {
    signerId: string;
    type: WalletTypes;
}

export interface ILockedWalletMeta extends IWalletMetaBase {
    id?: undefined;
    isUnlocked: false;
    accounts: IAccountMeta[];
}

export interface IUnlockedWalletMeta extends IWalletMetaBase {
    id: string;
    isUnlocked: true;
    accounts: IUnlockedAccountMeta[];
}

export type IWalletMeta = ILockedWalletMeta | IUnlockedWalletMeta;

export enum WalletActions {
    CREATE_WALLET = "create-wallet",
}
