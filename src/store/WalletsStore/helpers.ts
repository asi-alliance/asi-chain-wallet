import { WalletPreferencesStorage } from "services/walletPreferences";
import { NETWORKS } from "constants/networks";
import {
    IAccountMeta,
    IActiveWalletSession,
    ILockedWalletMeta,
    INetworksStateMeta,
    IUnlockedAccountMeta,
    IUnlockedWalletMeta,
    IWalletMeta,
    Network,
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
    { wallet, selectedAccountId }: IActiveWalletSession,
): void => {
    addWalletToWalletsStore(state.wallets, wallet);
    lockOtherWallets(state.wallets, wallet.signerId);
    state.selectedAccountId = selectedAccountId;
};

const restoreSelectedAccountId = (
    wallet: IUnlockedWalletMeta,
): string | null => {
    const storedAccountId: string | null =
        WalletPreferencesStorage.getSelectedAccountId(wallet.signerId);

    const selectedAccountId: string | null =
        wallet.accounts.find(
            (accountMeta: IUnlockedAccountMeta) =>
                accountMeta.id === storedAccountId,
        )?.id ??
        wallet.accounts[0]?.id ??
        null;

    if (selectedAccountId && selectedAccountId !== storedAccountId) {
        WalletPreferencesStorage.setSelectedAccountId(
            wallet.signerId,
            selectedAccountId,
        );
    }

    return selectedAccountId;
};

export const hasSameNetworkConnection = (
    network: Network,
    otherNetwork: Network,
): boolean =>
    network.validatorUrl === otherNetwork.validatorUrl &&
    network.observerUrl === otherNetwork.observerUrl &&
    network.indexerUrl === otherNetwork.indexerUrl &&
    network.nodeApiProfile === otherNetwork.nodeApiProfile;

const isSameNetwork = (network: Network, otherNetwork: Network): boolean =>
    network.id === otherNetwork.id &&
    network.name === otherNetwork.name &&
    network.isDefault === otherNetwork.isDefault &&
    hasSameNetworkConnection(network, otherNetwork);

const withConfiguredNetworkName = (network: Network): Network => {
    if (!network.isDefault) {
        return network;
    }

    const configuredNetwork: Network | undefined = NETWORKS.find(
        (networkMeta: Network) => networkMeta.id === network.id,
    );

    return configuredNetwork
        ? { ...network, name: configuredNetwork.name }
        : network;
};

const reuseUnchangedNetwork = (
    currentNetworks: Network[],
    network: Network,
): Network =>
    currentNetworks.find((currentNetwork: Network) =>
        isSameNetwork(currentNetwork, network),
    ) ?? network;

export const applyNetworksState = (
    state: WalletStoreState,
    { networks, selectedNetwork }: INetworksStateMeta,
): void => {
    const nextNetworks: Network[] = networks.map((network: Network) =>
        reuseUnchangedNetwork(
            state.networks,
            withConfiguredNetworkName(network),
        ),
    );

    state.networks = nextNetworks;
    state.selectedNetwork = reuseUnchangedNetwork(
        nextNetworks,
        withConfiguredNetworkName(selectedNetwork),
    );
};

export const toActiveWalletSession = (
    wallet: IUnlockedWalletMeta,
): IActiveWalletSession => ({
    wallet,
    selectedAccountId: restoreSelectedAccountId(wallet),
});
