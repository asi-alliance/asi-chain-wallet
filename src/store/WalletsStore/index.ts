import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
    WalletStoreState,
    IWalletMeta,
    IAccountMeta,
    IUnlockedWalletMeta,
    Network,
    TCustomNetwork,
} from "types/wallet";
import { RootState } from "store";
import { SdkWalletService } from "sdk";
import {
    getInitialNetwork,
    NETWORKS,
    persistSelectedNetworkId,
} from "constants/networks";
import {
    addCustomNetwork,
    ICustomNetworkDefaultGetFieldsPayload,
    IUpdateNetworkPayload,
    loadWalletsFromStorage,
    removeAccount,
    removeCustomNetwork,
    removeWallet,
    sendTransaction,
    updateAccountName,
    updateCustomNetwork,
} from "./thunks";
import {
    applyActiveWalletSession,
    getUnlockedAccountFromWalletsMeta,
    getUnlockedWalletAndAccountFromWalletsMeta,
    persistSelectedAccountId,
    toLockedWalletMeta,
} from "./helpers";
import { walletsApi } from "./api";
import {
    createHdWallet,
    deriveHdAccount,
    importHdWallet,
    importPrivateKeyWallet,
    loginWithPassword,
    logout,
} from "store/Auth/thunks";

const initialState: WalletStoreState = {
    wallets: [],
    selectedAccountId: null,
    networks: [...NETWORKS],
    selectedNetwork: getInitialNetwork(),
    isLoading: false,
    isInitialLoadComplete: false,
};

export interface IAccountDefaultUpdateFieldsPayload {
    walletId: string;
    accountId: string;
}

const walletsStoreSlice = createSlice({
    name: "wallets-store",
    initialState,
    reducers: {
        selectAccount: (state, action: PayloadAction<string>) => {
            const walletAndAccount = getUnlockedWalletAndAccountFromWalletsMeta(
                state.wallets,
                action.payload,
            );

            if (!walletAndAccount) {
                console.error(
                    "walletsStoreSlice.selectAccount: Account not found in any unlocked wallet",
                );

                return;
            }

            state.selectedAccountId = walletAndAccount.account.id;

            persistSelectedAccountId(walletAndAccount.account.id);
        },
        selectNetwork: (state, action: PayloadAction<string>) => {
            const network = state.networks.find(
                (networkMeta) => networkMeta.id === action.payload,
            );

            if (!network || state.selectedNetwork.id === network.id) {
                return;
            }

            SdkWalletService.setNetwork(network.id);

            state.selectedNetwork = network;

            persistSelectedNetworkId(network.id);
        },
        addNetworks: (state, action: PayloadAction<Network[]>) => {
            state.networks.push(...action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadWalletsFromStorage.fulfilled, (state, action) => {
                state.wallets = action.payload;
                state.isInitialLoadComplete = true;
            })
            .addCase(loadWalletsFromStorage.rejected, (state) => {
                state.isInitialLoadComplete = true;
            })
            .addCase(removeWallet.fulfilled, (state, action) => {
                const { removedWalletId, removedSignerId } = action.payload;

                state.wallets = state.wallets.filter((walletMeta) => {
                    if (walletMeta.isUnlocked) {
                        return walletMeta.id !== removedWalletId;
                    }

                    return walletMeta.signerId !== removedSignerId;
                });

                if (!state.wallets.length) {
                    state.selectedAccountId = null;

                    return;
                }

                state.selectedAccountId = state.wallets[0].accounts[0].id;
            })
            .addCase(removeAccount.fulfilled, (state, action) => {
                const { walletId, accountId } = action.payload;

                const wallet = state.wallets.find(
                    (walletMeta) => walletMeta.id === walletId,
                );

                if (!wallet) {
                    throw new Error(
                        "walletsStoreSlice.removeAccount: Incorrect wallet id",
                    );
                }

                wallet.accounts = wallet.accounts.filter(
                    (accountMeta) => accountMeta.id !== accountId,
                );

                if (state.selectedAccountId === accountId) {
                    state.selectedAccountId = wallet.accounts[0]?.id ?? null;
                }
            })
            .addCase(updateAccountName.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateAccountName.fulfilled, (state, action) => {
                const { accountId, name } = action.payload;

                const targetAccount: IAccountMeta | null =
                    getUnlockedAccountFromWalletsMeta(state.wallets, accountId);

                if (!targetAccount) {
                    console.error(
                        "walletsStoreSlice.updateAccountName: Incorrect account id",
                    );

                    return;
                }

                targetAccount.name = name;
                state.isLoading = false;
            })
            .addCase(updateAccountName.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(
                addCustomNetwork.fulfilled,
                (state, action: PayloadAction<TCustomNetwork>) => {
                    state.networks.push(action.payload);

                    state.isLoading = false;
                },
            )
            .addCase(addCustomNetwork.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(addCustomNetwork.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(
                updateCustomNetwork.fulfilled,
                (state, action: PayloadAction<IUpdateNetworkPayload>) => {
                    const { id, update } = action.payload;

                    const targetNetworkIndex = state.networks.findIndex(
                        (network: Network) => network.id === id,
                    );

                    if (targetNetworkIndex === -1) {
                        console.error(
                            "walletsStoreSlice.updateCustomNetwork: Incorrect network id",
                        );

                        return;
                    }

                    state.networks[targetNetworkIndex] = {
                        ...state.networks[targetNetworkIndex],
                        ...update,
                    };

                    if (state.selectedNetwork.id === id) {
                        state.selectedNetwork = {
                            ...state.selectedNetwork,
                            ...update,
                        };
                    }

                    state.isLoading = false;
                },
            )
            .addCase(updateCustomNetwork.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateCustomNetwork.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(
                removeCustomNetwork.fulfilled,
                (
                    state,
                    action: PayloadAction<ICustomNetworkDefaultGetFieldsPayload>,
                ) => {
                    const { id } = action.payload;

                    state.networks = state.networks.filter(
                        (network: Network) => network.id !== id,
                    );

                    if (state.selectedNetwork.id === id) {
                        state.selectedNetwork = state.networks[0]!;
                    }

                    state.isLoading = false;
                },
            )
            .addCase(removeCustomNetwork.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(removeCustomNetwork.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(sendTransaction.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(sendTransaction.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(sendTransaction.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(createHdWallet.fulfilled, (state, action) => {
                applyActiveWalletSession(state, action.payload);
            })
            .addCase(importHdWallet.fulfilled, (state, action) => {
                applyActiveWalletSession(state, action.payload);
            })
            .addCase(importPrivateKeyWallet.fulfilled, (state, action) => {
                applyActiveWalletSession(state, action.payload);
            })
            .addCase(deriveHdAccount.fulfilled, (state, action) => {
                applyActiveWalletSession(state, action.payload.wallet);
                state.selectedAccountId = action.payload.accountId;
            })
            .addCase(loginWithPassword.fulfilled, (state, action) => {
                applyActiveWalletSession(state, action.payload);
            })
            .addCase(logout.fulfilled, (state) => {
                state.wallets = state.wallets.map(toLockedWalletMeta);
                state.selectedAccountId = null;
            });
    },
});

export const selectAccountById = (state: RootState, accountId: string) =>
    getUnlockedAccountFromWalletsMeta(state.walletsStore.wallets, accountId);
export const selectWalletByAccountId = (state: RootState, accountId: string) =>
    state.walletsStore.wallets.find((walletMeta: IWalletMeta) =>
        walletMeta.accounts.some(
            (accountMeta: IAccountMeta) => accountMeta.id === accountId,
        ),
    ) ?? null;
export const selectWalletByFilter = (
    state: RootState,
    filter: (
        walletMeta: IWalletMeta,
        index: number,
        array: IWalletMeta[],
    ) => boolean,
) => state.walletsStore.wallets.find(filter) ?? null;
export const selectWallets = (state: RootState) => state.walletsStore.wallets;
export const selectActiveWallet = createSelector(
    [selectWallets, (state: RootState) => state.auth.activeSignerId],
    (
        wallets: IWalletMeta[],
        activeSignerId: string | null,
    ): IUnlockedWalletMeta | null =>
        wallets.find(
            (walletMeta: IWalletMeta): walletMeta is IUnlockedWalletMeta =>
                walletMeta.isUnlocked && walletMeta.signerId === activeSignerId,
        ) ?? null,
);

export const selectAccounts = createSelector(
    [selectActiveWallet],
    (activeWallet: IUnlockedWalletMeta | null) => activeWallet?.accounts ?? [],
);
export const selectSelectedAccountId = (state: RootState) =>
    state.walletsStore.selectedAccountId;
export const selectSelectedNetworkId = (state: RootState) =>
    state.walletsStore.selectedNetwork.id;
export const selectIsAnyAccountBalanceFetching = (
    state: RootState,
): boolean => {
    const networkId = selectSelectedNetworkId(state);

    return selectAccounts(state).some(
        (accountMeta: IAccountMeta) =>
            walletsApi.endpoints.getBalance.select({
                accountId: accountMeta.id,
                networkId,
            })(state).isLoading,
    );
};

export const selectUnlockedWallets = createSelector(
    [selectWallets],
    (wallets: IWalletMeta[]): IUnlockedWalletMeta[] =>
        wallets.filter(
            (walletMeta: IWalletMeta): walletMeta is IUnlockedWalletMeta =>
                walletMeta.isUnlocked,
        ),
);
export const selectHasWallets = (state: RootState) =>
    state.walletsStore.wallets.length > 0;
export const selectWalletsInitialLoadComplete = (state: RootState) =>
    state.walletsStore.isInitialLoadComplete;
export const selectIsAccountUnlocked = (state: RootState, accountId: string) =>
    state.walletsStore.wallets.some(
        (w) => w.isUnlocked && w.accounts.some((a) => a.id === accountId),
    );

export const { selectAccount, selectNetwork, addNetworks } =
    walletsStoreSlice.actions;

export default walletsStoreSlice.reducer;
