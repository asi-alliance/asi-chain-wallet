import { SecureStorage } from "services/secureStorage";
import {
    Account,
    IAccountMeta,
    ILockedWalletMeta,
    IUnlockedAccountMeta,
    IUnlockedWalletMeta,
    IWalletMeta,
    Network,
    WalletStoreState,
} from "types/wallet";
import { Transaction } from "types/transactions";
import { TransactionStatus } from "@asichain/asi-wallet-sdk";
import { NETWORKS } from "constants/networks";

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

export const isPredefinedNetwork = (networkId: string): boolean => {
    return NETWORKS.some((network: Network) => network.id === networkId);
};

export const NETWORKS_STORAGE_KEY = "asi_wallet_networks";
export const getAccountNetworksKey = (accountId?: string | null) =>
    accountId ? `${NETWORKS_STORAGE_KEY}_${accountId}` : NETWORKS_STORAGE_KEY;

type AccountNetworkUpdate = { id: string; networkId: string };

// Accepts both Account (unlocked, from session) and SecureAccount (from storage)
type SanitizableAccount = Omit<Account, "privateKey"> & {
    privateKey?: string;
    encryptedPrivateKey?: string;
};

export const sanitizeAccounts = (
    accounts: SanitizableAccount[],
    networkId?: string,
) => {
    const updates: AccountNetworkUpdate[] = [];

    const sanitized = accounts.map((acc) => {
        const sanitizedAccount: Account = {
            id: acc.id,
            name: acc.name,
            address: acc.address,
            revAddress: acc.revAddress,
            ethAddress: acc.ethAddress,
            publicKey: acc.publicKey,
            balance: acc.balance,
            isMetamask: acc.isMetamask,
            networkId: acc.networkId,
            createdAt: acc.createdAt,
            privateKey: undefined,
        };

        if (networkId && !sanitizedAccount.networkId) {
            sanitizedAccount.networkId = networkId;
            updates.push({ id: sanitizedAccount.id, networkId });
        }

        return sanitizedAccount;
    });

    return { sanitized, updates };
};

export const persistAccountNetworkUpdates = (
    updates: AccountNetworkUpdate[],
) => {
    if (!updates.length) {
        return;
    }
    SecureStorage.updateAccountsNetworkBulk(updates);
};

export const filterAccountsForNetwork = (
    accounts: Account[],
    networkId?: string,
): Account[] => {
    if (!networkId) {
        return accounts;
    }

    return accounts.filter((account) => account.networkId === networkId);
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

export const loadNetworks = (accountId?: string | null): Network[] => {
    const result: Network[] = [...NETWORKS];
    const envNetworkIds = new Set(
        NETWORKS.map((network: Network) => network.id),
    );

    if (typeof window !== "undefined" && window.localStorage) {
        try {
            const stored =
                localStorage.getItem(getAccountNetworksKey(accountId)) ||
                localStorage.getItem(NETWORKS_STORAGE_KEY);
            if (stored) {
                const storedNetworks = JSON.parse(stored) as Network[];

                storedNetworks.forEach((n) => {
                    if (
                        n.id?.startsWith("custom") &&
                        !envNetworkIds.has(n.id)
                    ) {
                        result.push(n);
                    }
                });
            }
        } catch (error) {
            console.error("Failed to load networks from localStorage:", error);
        }
    }

    return result;
};

export const saveNetworks = (
    networks: Network[],
    accountId?: string | null,
) => {
    if (typeof window === "undefined" || !window.localStorage) {
        return;
    }

    try {
        const customNetworks = networks.filter((n) =>
            n.id?.startsWith("custom"),
        );
        const key = getAccountNetworksKey(accountId);
        if (customNetworks.length > 0) {
            localStorage.setItem(key, JSON.stringify(customNetworks));
        } else {
            localStorage.removeItem(key);
        }
    } catch (error) {
        console.error("Failed to save networks to localStorage:", error);
    }
};
