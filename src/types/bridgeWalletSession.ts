import { IUnlockedAccountMeta, IUnlockedWalletMeta } from "types/wallet";

export interface IWalletAccount {
    id: string;
    name: string;
    address: string;
    balance: string;
}

export interface AsiWalletSession {
    account?: IUnlockedAccountMeta | null;
    walletId?: IUnlockedWalletMeta["id"];
}

export interface CardanoWalletSession {
    connected: boolean;
    loading: boolean;
    error?: string;

    connect: () => Promise<void>;
    disconnect: () => Promise<void>;

    account?: IWalletAccount;

    balance: string;
    balanceLoading: boolean;
    refreshBalance: () => Promise<void>;
}

export interface EvmWalletSession {
    connected: boolean;
    loading: boolean;
    error?: string;

    connect: () => void;

    account?: IWalletAccount;

    balance: string;
    refreshBalance: () => Promise<void>;

    wrongNetwork: boolean;
    switchNetwork: () => Promise<void>;
}

export interface CosmosWalletSession {
    connected: boolean;
    loading: boolean;
    error?: string;

    connect: () => Promise<void>;
    disconnect: () => Promise<void>;

    account?: IWalletAccount;

    balance: string;
    balanceLoading: boolean;
    refreshBalance: () => Promise<void>;
}

export interface IWalletSessionContext {
    asi: AsiWalletSession;
    cardano: CardanoWalletSession;
    evm: EvmWalletSession;
    cosmos: CosmosWalletSession;
}

export type WalletKind = keyof IWalletSessionContext;
