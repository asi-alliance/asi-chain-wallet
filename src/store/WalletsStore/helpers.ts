import { SecureStorage } from "services/secureStorage";
import {
    Account,
    IAccountMeta,
    IWalletMeta,
    Network,
    WalletStoreState,
} from "types/wallet";
import { NETWORKS } from "constants/networks";

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

export const lockOtherWallets = (
    wallets: IWalletMeta[],
    activeSignerId: string,
): void => {
    for (const walletMeta of wallets) {
        if (walletMeta.signerId === activeSignerId) {
            continue;
        }

        walletMeta.id = undefined;
        walletMeta.isUnlocked = false;
    }
};

export const applyActiveWalletSession = (
    state: WalletStoreState,
    wallet: IWalletMeta,
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
