import { IAccountMeta, IWalletMeta } from "types/wallet";

export interface IWalletAndAccountPathFromMeta {
    wallet: IWalletMeta;
    account: IAccountMeta;
}

export const getAccountFromWalletsMeta = (
    walletsMeta: IWalletMeta[],
    accountId: string,
): IAccountMeta | null => {
    for (const walletMeta of walletsMeta) {
        const targetAccount: IAccountMeta | undefined =
            walletMeta.accounts.find(
                (accountMeta: IAccountMeta) => accountMeta.id === accountId,
            );

        if (!targetAccount) {
            continue;
        }

        return targetAccount;
    }

    return null;
};

export const getWalletAndAccountFromWalletsMeta = (
    walletsMeta: IWalletMeta[],
    accountId: string,
): IWalletAndAccountPathFromMeta | null => {
    for (const walletMeta of walletsMeta) {
        const targetAccount: IAccountMeta | undefined =
            walletMeta.accounts.find(
                (accountMeta: IAccountMeta) => accountMeta.id === accountId,
            );

        if (!targetAccount) {
            continue;
        }

        return { wallet: walletMeta, account: targetAccount };
    }

    return null;
};

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
