import { IAccountMeta, IWalletMeta } from "types/wallet";

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
