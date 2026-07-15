import { configureStore } from "@reduxjs/toolkit";
import walletReducer from "./WalletsStore/walletsStoreSlice";
import themeReducer from "./themeSlice";
import authReducer from "./authSlice";
import hardwareWalletReducer from "./hardwareWalletSlice";
import multisigReducer from "./multisigSlice";

export const store = configureStore({
    reducer: {
        walletsStore: walletReducer,
        theme: themeReducer,
        auth: authReducer,
        hardwareWallet: hardwareWalletReducer,
        multisig: multisigReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    "walletsStore/setAccounts",
                    "walletsStore/addAccount",
                    "auth/createAccountWithPassword/fulfilled",
                    "auth/importAccountWithPassword/fulfilled",
                    "auth/loginWithPassword/fulfilled",
                    "hardwareWallet/sign/fulfilled",
                    "multisig/createWallet/fulfilled",
                    "multisig/loadWalletDetails/fulfilled",
                ],
                ignoredPaths: [
                    "walletsStore.accounts",
                    "walletsStore.selectedAccount",
                    "auth.unlockedAccounts",
                    "auth.lastActivity",
                    "hardwareWallet.accounts",
                    "hardwareWallet.selectedAccount",
                    "multisig.wallets",
                    "multisig.selectedWallet",
                    "multisig.transactions",
                    "multisig.lastUpdated",
                ],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
