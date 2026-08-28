import {
    IAccountMeta,
    ILockedWalletMeta,
    IUnlockedAccountMeta,
    IUnlockedWalletMeta,
    IWalletMeta,
    WalletStoreState,
} from "types/wallet";
import { Transaction } from "types/transactions";
import { TransactionStatus } from "@asichain/asi-wallet-sdk";

export interface IUnlockedWalletAndAccountPathFromMeta {
    wallet: IUnlockedWalletMeta;
    account: IUnlockedAccountMeta;
}

export interface ITransactionStatusUpdate {
    deployId: string;
    status: TransactionStatus;
    error?: string;
}

export const updateTransactionStatus = (
    transactions: Transaction[],
    { deployId, status, error }: ITransactionStatusUpdate,
): void => {
    const targetTransaction: Transaction | undefined = transactions.find(
        (transaction: Transaction) => transaction.deployId === deployId,
    );

    if (!targetTransaction) {
        return;
    }

    targetTransaction.status = status;

    if (error) {
        targetTransaction.error = error;
    }
};

export const getUnlockedWalletAndAccountFromWalletsMeta = (
    walletsMeta: IWalletMeta[],
    accountId: string,
): IUnlockedWalletAndAccountPathFromMeta | null => {
    for (const walletMeta of walletsMeta) {
        if (!walletMeta.isUnlocked) {
            continue;
        }

        const targetAccount: IUnlockedAccountMeta | undefined =
            walletMeta.accounts.find(
                (accountMeta: IUnlockedAccountMeta) =>
                    accountMeta.id === accountId,
            );

        if (!targetAccount) {
            continue;
        }

        return { wallet: walletMeta, account: targetAccount };
    }

    return null;
};

export const getUnlockedAccountFromWalletsMeta = (
    walletsMeta: IWalletMeta[],
    accountId: string,
): IUnlockedAccountMeta | null =>
    getUnlockedWalletAndAccountFromWalletsMeta(walletsMeta, accountId)
        ?.account ?? null;

export const addWalletToWalletsStore = (
    wallets: IWalletMeta[],
    wallet: IWalletMeta,
): void => {
    const index = wallets.findIndex(
        (walletMeta) => walletMeta.signerId === wallet.signerId,
    );

    if (index === -1) {
        wallets.push(wallet);

        return;
    }

    wallets[index] = wallet;
};

export const toLockedWalletMeta = ({
    signerId,
    type,
    accounts,
}: IWalletMeta): ILockedWalletMeta => ({
    signerId,
    type,
    isUnlocked: false,
    accounts: accounts.map(({ id, name, index }: IAccountMeta) => ({
        id,
        name,
        index,
    })),
});

export const lockOtherWallets = (
    wallets: IWalletMeta[],
    activeSignerId: string,
): void => {
    wallets.forEach((walletMeta: IWalletMeta, index: number) => {
        if (walletMeta.signerId === activeSignerId) {
            return;
        }

        wallets[index] = toLockedWalletMeta(walletMeta);
    });
};

export const applyActiveWalletSession = (
    state: WalletStoreState,
    wallet: IUnlockedWalletMeta,
): void => {
    addWalletToWalletsStore(state.wallets, wallet);
    lockOtherWallets(state.wallets, wallet.signerId);
    state.selectedAccountId = wallet.accounts[0]?.id ?? null;
};

export const persistSelectedAccountId = (accountId: string | null) => {
    if (typeof window === "undefined" || !window.localStorage) {
        return;
    }

    if (accountId) {
        localStorage.setItem("selectedAccountId", accountId);
    } else {
        localStorage.removeItem("selectedAccountId");
    }
};
