import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
    Network,
    WalletStoreState,
    IWalletMeta,
    IAccountMeta,
} from "types/wallet";
import { RootState } from "store";
import { SdkWalletService } from "sdk";
import { NetworkName } from "@asichain/asi-wallet-sdk";
import {
    fetchBalance,
    fetchTransactionHistory,
    loadWalletsFromStorage,
    removeWallet,
    sendTransaction,
    updateAccountName,
} from "./thunks";
import {
    applyActiveWalletSession,
    getAccountFromWalletsMeta,
    getInitialNetworks,
    getWalletAndAccountFromWalletsMeta,
    NETWORKS_STORAGE_KEY,
    persistSelectedAccountId,
    SELECTED_NETWORK_KEY,
} from "./helpers";
import { Transaction } from "types/transactions";
import {
    createAccountWithPassword,
    importAccountWithPassword,
    loginWithPassword,
    logout,
    unlockAccount,
} from "store/Auth/thunks";

const initialNetworks = getInitialNetworks();

const createInitialState = (): WalletStoreState => {
    const networks = initialNetworks;

    let defaultNetwork: Network | undefined;

    try {
        if (typeof window !== "undefined" && window.localStorage) {
            const selectedNetworkId =
                localStorage.getItem(SELECTED_NETWORK_KEY);
            if (selectedNetworkId) {
                defaultNetwork = networks.find(
                    (n) =>
                        n.id === selectedNetworkId &&
                        n.url &&
                        n.url.trim() !== "",
                );
            }
        }
    } catch (error) {
        console.error(
            "Failed to load selected network from localStorage:",
            error,
        );
    }

    if (!defaultNetwork) {
        defaultNetwork = networks.find((n) => n.url && n.url.trim() !== "");
    }

    if (!defaultNetwork) {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                const stored = localStorage.getItem(NETWORKS_STORAGE_KEY);
                if (stored) {
                    const storedNetworks = JSON.parse(stored) as Network[];
                    defaultNetwork = storedNetworks.find(
                        (n) => n.url && n.url.trim() !== "",
                    );
                }
            }
        } catch (error) {
            console.error(
                "Failed to load default network from localStorage:",
                error,
            );
        }
    }

    if (!defaultNetwork) {
        defaultNetwork = {
            id: "default",
            name: "Default Network",
            url: "",
            shardId: "root",
        };
    }

    return {
        wallets: [],
        balances: {},
        selectedAccountId: null,
        transactions: [],
        networks: networks,
        selectedNetwork: defaultNetwork,
        isLoading: false,
    };
};

const initialState: WalletStoreState = createInitialState();

export interface IAccountDefaultUpdateFieldsPayload {
    walletId: string;
    accountId: string;
}

export interface IAccountUpdateBalancePayload {
    accountId: string;
    balance: string;
}

const walletsStoreSlice = createSlice({
    name: "wallets-store",
    initialState,
    reducers: {
        selectAccount: (state, action: PayloadAction<string>) => {
            const walletAndAccount = getWalletAndAccountFromWalletsMeta(
                state.wallets,
                action.payload,
            );

            if (!walletAndAccount) {
                console.error(
                    "walletsStoreSlice.selectAccount: Incorrect account id",
                );

                return;
            }

            if (!walletAndAccount.wallet.isUnlocked) {
                console.error(
                    "walletsStoreSlice.selectAccount: Account belongs to a locked wallet",
                );

                return;
            }

            state.selectedAccountId = walletAndAccount.account.id;

            persistSelectedAccountId(walletAndAccount.account.id);
        },
        selectNetwork: (state, action: PayloadAction<string>) => {
            const network = state.networks.find((n) => n.id === action.payload);

            if (!network || !network.url || network.url.trim() === "") {
                return;
            }

            if (state.selectedNetwork?.id === network.id) {
                return;
            }

            SdkWalletService.setNetwork(network.name as NetworkName);

            state.selectedNetwork = network;

            if (typeof window !== "undefined" && window.localStorage) {
                localStorage.setItem(SELECTED_NETWORK_KEY, network.id);
            }
        },
        updateAccountBalance: (
            state,
            action: PayloadAction<IAccountUpdateBalancePayload>,
        ) => {
            const { accountId, balance } = action.payload;

            const targetAccount: IAccountMeta | null =
                getAccountFromWalletsMeta(state.wallets, accountId);

            if (!targetAccount) {
                console.error(
                    "walletsStoreSlice.updateAccountBalance: Incorrect account id",
                );

                return;
            }

            state.balances[targetAccount.id] = balance;
        },
        addTransaction: (state, action: PayloadAction<Transaction>) => {
            state.transactions.unshift(action.payload);
        },
        //TODO: Updated Custom Networks CRUD operations after SDK feature updates
        // updateNetwork: (state, action: PayloadAction<Network>) => {
        //     const networkToUpdate = action.payload;

        //     if (isPredefinedNetwork(networkToUpdate.id)) {
        //         console.warn(
        //             `Cannot update predefined network "${networkToUpdate.id}". Only custom networks can be edited.`,
        //         );
        //         return;
        //     }

        //     if (!networkToUpdate.id?.startsWith("custom")) {
        //         console.warn(
        //             `Network updates are only allowed for custom networks (custom-*). Attempted to update: "${networkToUpdate.id}"`,
        //         );
        //         return;
        //     }
        //     const index = state.networks.findIndex(
        //         (n) => n.id === action.payload.id,
        //     );
        //     if (index !== -1) {
        //         state.networks[index] = action.payload;
        //         if (state.selectedNetwork.id === action.payload.id) {
        //             state.selectedNetwork = action.payload;
        //         }
        //     } else {
        //         state.networks.push(action.payload);
        //     }
        //     saveNetworks(state.networks, state.selectedAccount?.id);
        // },
        // addNetwork: (state, action: PayloadAction<Network>) => {
        //     const networkToAdd = action.payload;

        //     if (isPredefinedNetwork(networkToAdd.id)) {
        //         console.warn(
        //             `Cannot add predefined network "${networkToAdd.id}" as custom network.`,
        //         );
        //         return;
        //     }
        //     const timestamp = Date.now();
        //     const newNetwork = {
        //         ...action.payload,
        //         id: action.payload.id?.startsWith("custom")
        //             ? action.payload.id
        //             : `custom-${timestamp}`,
        //     };
        //     state.networks.push(newNetwork);
        //     saveNetworks(state.networks, state.selectedAccount?.id);
        // },
        // removeNetwork: (state, action: PayloadAction<string>) => {
        //     const id = action.payload;
        //     if (!id?.startsWith("custom")) {
        //         console.warn(
        //             `Only custom networks can be removed. Attempted: "${id}"`,
        //         );
        //         return;
        //     }
        //     state.networks = state.networks.filter((n) => n.id !== id);
        //     saveNetworks(state.networks, state.selectedAccount?.id);
        //     if (state.selectedNetwork?.id === id) {
        //         const firstAvailable =
        //             state.networks.find((n) => n.url && n.url.trim() !== "") ||
        //             state.networks[0];
        //         if (firstAvailable) {
        //             state.selectedNetwork = firstAvailable;
        //             if (typeof window !== "undefined" && window.localStorage) {
        //                 localStorage.setItem(
        //                     SELECTED_NETWORK_KEY,
        //                     firstAvailable.id,
        //                 );
        //             }
        //         }
        //     }
        // },
        // loadNetworksFromStorage: (state) => {
        //     const loadedNetworks = loadNetworks(state.selectedAccount?.id);
        //     state.networks = loadedNetworks;

        //     try {
        //         if (typeof window !== "undefined" && window.localStorage) {
        //             const selectedNetworkId =
        //                 localStorage.getItem(SELECTED_NETWORK_KEY);
        //             if (selectedNetworkId) {
        //                 const selectedNetwork = loadedNetworks.find(
        //                     (n) =>
        //                         n.id === selectedNetworkId &&
        //                         n.url &&
        //                         n.url.trim() !== "",
        //                 );
        //                 if (selectedNetwork) {
        //                     state.selectedNetwork = selectedNetwork;
        //                     return;
        //                 }
        //             }
        //         }
        //     } catch (error) {
        //         console.error("Failed to restore selected network:", error);
        //     }

        //     const currentSelected = loadedNetworks.find(
        //         (n) =>
        //             n.id === state.selectedNetwork.id &&
        //             n.url &&
        //             n.url.trim() !== "",
        //     );
        //     if (currentSelected) {
        //         state.selectedNetwork = currentSelected;
        //     } else {
        //         const firstAvailable = loadedNetworks.find(
        //             (n) => n.url && n.url.trim() !== "",
        //         );
        //         if (firstAvailable) {
        //             state.selectedNetwork = firstAvailable;
        //         }
        //     }
        // },
        updateTransactionStatus: (
            state,
            action: PayloadAction<{
                deployId: string;
                status: "pending" | "completed" | "failed";
                error?: string;
            }>,
        ) => {
            const transaction = state.transactions.find(
                (tx) => tx.deployId === action.payload.deployId,
            );
            if (transaction) {
                transaction.status = action.payload.status;
                if (action.payload.error) {
                    transaction.error = action.payload.error;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadWalletsFromStorage.fulfilled, (state, action) => {
                state.wallets = action.payload;
            })
            .addCase(removeWallet.fulfilled, (state, action) => {
                const { accountId, removedWalletId, removedSignerId } =
                    action.payload;

                state.wallets = state.wallets.filter((walletMeta) => {
                    if (walletMeta.isUnlocked) {
                        return walletMeta.id !== removedWalletId;
                    }

                    return walletMeta.signerId !== removedSignerId;
                });

                if (state.selectedAccountId === accountId) {
                    state.selectedAccountId = null;
                }

                if (!state.wallets.length) {
                    return;
                }

                state.selectedAccountId = state.wallets[0].accounts[0].id;
            })
            .addCase(updateAccountName.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateAccountName.fulfilled, (state, action) => {
                const { accountId, name } = action.payload;

                const targetAccount: IAccountMeta | null =
                    getAccountFromWalletsMeta(state.wallets, accountId);

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
            .addCase(fetchBalance.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchBalance.fulfilled, (state, action) => {
                const { accountId, balance } = action.payload;

                state.balances[accountId] = balance;
                state.isLoading = false;
            })
            .addCase(fetchBalance.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(sendTransaction.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(sendTransaction.fulfilled, (state, action) => {
                state.transactions.unshift(action.payload);
                state.isLoading = false;
            })
            .addCase(sendTransaction.rejected, (state) => {
                state.isLoading = false;
            })
            .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
                const existingIds = new Set(
                    state.transactions.map((tx) => tx.id),
                );
                const newTransactions = action.payload.filter(
                    (tx) => !existingIds.has(tx.id),
                );

                state.transactions = [
                    ...newTransactions,
                    ...state.transactions,
                ];
            })
            .addCase(createAccountWithPassword.fulfilled, (state, action) => {
                applyActiveWalletSession(state, action.payload.wallet);
            })
            .addCase(importAccountWithPassword.fulfilled, (state, action) => {
                applyActiveWalletSession(state, action.payload);
            })
            .addCase(unlockAccount.fulfilled, (state, action) => {
                applyActiveWalletSession(state, action.payload);
            })
            .addCase(loginWithPassword.fulfilled, (state, action) => {
                applyActiveWalletSession(state, action.payload);
            })
            .addCase(logout.fulfilled, (state) => {
                state.wallets = state.wallets.map((walletMeta) => ({
                    ...walletMeta,
                    id: undefined,
                    isUnlocked: false,
                }));
                state.selectedAccountId = null;
            });
    },
});

export const selectAccountById = (state: RootState, accountId: string) =>
    getAccountFromWalletsMeta(state.walletsStore.wallets, accountId);
export const selectWalletByAccountId = (state: RootState, accountId: string) =>
    state.walletsStore.wallets.find((walletMeta: IWalletMeta) =>
        walletMeta.accounts.some(
            (accountMeta: IAccountMeta) => accountMeta.id === accountId,
        ),
    ) ?? null;
export const selectWallets = (state: RootState) => state.walletsStore.wallets;
export const selectActiveWallet = createSelector(
    [selectWallets, (state: RootState) => state.auth.activeSignerId],
    (wallets: IWalletMeta[], activeSignerId: string | null) =>
        wallets.find(
            (walletMeta: IWalletMeta) =>
                walletMeta.isUnlocked && walletMeta.signerId === activeSignerId,
        ) ?? null,
);
export const selectAccounts = createSelector(
    [selectActiveWallet],
    (activeWallet: IWalletMeta | null) => activeWallet?.accounts ?? [],
);
export const selectSelectedAccountId = (state: RootState) =>
    state.walletsStore.selectedAccountId;
export const selectBalanceByAccountId = (state: RootState, accountId: string) =>
    state.walletsStore.balances[accountId] ?? "0";

export const selectUnlockedWallets = createSelector(
    [selectWallets],
    (wallets: IWalletMeta[]) => wallets.filter((w) => w.isUnlocked),
);
export const selectHasWallets = (state: RootState) =>
    state.walletsStore.wallets.length > 0;
export const selectIsAccountUnlocked = (state: RootState, accountId: string) =>
    state.walletsStore.wallets.some(
        (w) => w.isUnlocked && w.accounts.some((a) => a.id === accountId),
    );

export const {
    selectAccount,
    selectNetwork,
    updateAccountBalance,
    addTransaction,
    // updateNetwork,
    // addNetwork,
    // removeNetwork,
    // loadNetworksFromStorage,
    updateTransactionStatus,
} = walletsStoreSlice.actions;

export default walletsStoreSlice.reducer;
