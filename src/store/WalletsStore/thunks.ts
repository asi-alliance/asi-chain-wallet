import { IAccountDefaultUpdateFieldsPayload } from ".";
import {
    Account,
    IAccountMeta,
    IUnlockedAccountMeta,
    IWalletMeta,
    Network,
} from "types/wallet";
import { SecureStorage } from "services/secureStorage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Address } from "@asichain/asi-wallet-sdk";
import { RChainService } from "services/rchain";
import { SdkWalletService } from "sdk";
import { WalletPreferencesStorage } from "services/walletPreferences";
import { RootState } from "store";
import { walletsApi, WalletsApiTags } from "./api";
import {
    getUnlockedAccountFromWalletsMeta,
    getUnlockedWalletAndAccountFromWalletsMeta,
} from "./helpers";

export const loadWalletsFromStorage = createAsyncThunk(
    "wallets-store/loadWalletsFromStorage",
    () => SdkWalletService.loadWallets(),
);

export interface IAccountRemovePayload {
    walletId: string;
    accountId: string;
}

export const selectNetwork = createAsyncThunk<
    Network,
    string,
    { state: RootState; rejectValue: string }
>(
    "wallets-store/selectNetwork",
    (networkId: string, { getState, rejectWithValue }) => {
        const { networks, selectedNetwork } = getState().walletsStore;

        if (selectedNetwork.id === networkId) {
            return rejectWithValue(
                "walletsStoreSlice.selectNetwork: This network already selected",
            );
        }

        const network: Network | undefined = networks.find(
            (networkMeta: Network) => networkMeta.id === networkId,
        );

        if (!network) {
            return rejectWithValue(
                "walletsStoreSlice.selectNetwork: Incorrect network id",
            );
        }

        SdkWalletService.setNetwork(network.id);
        WalletPreferencesStorage.setSelectedNetworkId(network.id);

        return network;
    },
);

export const selectAccount = createAsyncThunk<
    string,
    string,
    { state: RootState; rejectValue: string }
>(
    "wallets-store/selectAccount",
    (accountId: string, { getState, rejectWithValue }) => {
        const walletAndAccount = getUnlockedWalletAndAccountFromWalletsMeta(
            getState().walletsStore.wallets,
            accountId,
        );

        if (!walletAndAccount) {
            return rejectWithValue(
                "walletsStoreSlice.selectAccount: Account not found in any unlocked wallet",
            );
        }

        const { wallet, account } = walletAndAccount;

        WalletPreferencesStorage.setSelectedAccountId(
            wallet.signerId,
            account.id,
        );

        return account.id;
    },
);

export const removeWallet = createAsyncThunk(
    "walletsStore/removeWallet",
    async ({ walletId }: { walletId: string }, { rejectWithValue }) => {
        try {
            const removedWallet = await SdkWalletService.removeWallet(walletId);
            const removedSignerId = removedWallet.getSigner().getId();

            WalletPreferencesStorage.removeSigner(removedSignerId);

            return {
                removedWalletId: removedWallet.getId(),
                removedSignerId,
            };
        } catch (error) {
            return rejectWithValue(error);
        }
    },
);

export interface IAccountRemoveResponse extends IAccountRemovePayload {
    selectedAccountId: string | null;
}

export const removeAccount = createAsyncThunk<
    IAccountRemoveResponse,
    IAccountRemovePayload,
    { state: RootState }
>(
    "walletsStore/removeAccount",
    async (
        { walletId, accountId }: IAccountRemovePayload,
        { getState, rejectWithValue },
    ) => {
        try {
            await SdkWalletService.removeAccount(walletId, accountId);

            const { wallets, selectedAccountId } = getState().walletsStore;

            const wallet: IWalletMeta | undefined = wallets.find(
                (walletMeta: IWalletMeta) => walletMeta.id === walletId,
            );

            if (!wallet) {
                return { walletId, accountId, selectedAccountId };
            }

            if (selectedAccountId !== accountId) {
                return { walletId, accountId, selectedAccountId };
            }

            const nextSelectedAccountId: string | null =
                wallet.accounts.find(
                    (accountMeta: IAccountMeta) => accountMeta.id !== accountId,
                )?.id ?? null;

            if (nextSelectedAccountId) {
                WalletPreferencesStorage.setSelectedAccountId(
                    wallet.signerId,
                    nextSelectedAccountId,
                );

                return {
                    walletId,
                    accountId,
                    selectedAccountId: nextSelectedAccountId,
                };
            }

            WalletPreferencesStorage.removeSigner(wallet.signerId);

            return {
                walletId,
                accountId,
                selectedAccountId: nextSelectedAccountId,
            };
        } catch (error) {
            return rejectWithValue(error);
        }
    },
);

export interface IAccountUpdateNamePayload extends IAccountDefaultUpdateFieldsPayload {
    name: string;
}

export interface IAccountUpdateNameResponse {
    account: IAccountMeta;
    name: string;
}

export interface IAccountDefaultGetFieldsPayload {
    accountId: string;
}

export interface IAccountGetBalanceResponse extends IAccountDefaultGetFieldsPayload {
    balance: string;
}

export interface ITransferPayload {
    walletId: string;
    accountId: string;
    to: Address;
    amount: string;
    password?: string;
}

export const updateAccountName = createAsyncThunk<
    Omit<IAccountUpdateNamePayload, "walletId">,
    IAccountUpdateNamePayload,
    {
        state: RootState;
    }
>(
    "walletsStore/updateAccountName",
    async (
        payload: IAccountUpdateNamePayload,
        { rejectWithValue, getState },
    ) => {
        try {
            const { walletId, accountId, name } = payload;

            const targetAccount: IAccountMeta | null =
                getUnlockedAccountFromWalletsMeta(
                    getState().walletsStore.wallets,
                    accountId,
                );

            if (!targetAccount) {
                return rejectWithValue(
                    "walletsStoreSlice.updateAccountName: Incorrect account id",
                );
            }

            await SdkWalletService.renameAccount(walletId, accountId, name);

            return {
                accountId,
                name,
            };
        } catch (error: unknown) {
            return rejectWithValue(error);
        }
    },
);

export const sendTransaction = createAsyncThunk<
    { deployId: string },
    ITransferPayload,
    { state: RootState }
>(
    "wallets-store/sendTransaction",
    async (
        { walletId, accountId, to, amount, password }: ITransferPayload,
        { getState, dispatch },
    ) => {
        if (to.trim().toLowerCase().startsWith("0x")) {
            throw new Error("Sending to Ethereum addresses is not supported");
        }

        const fromAccount: IUnlockedAccountMeta | null =
            getUnlockedAccountFromWalletsMeta(
                getState().walletsStore.wallets,
                accountId,
            );

        if (!fromAccount) {
            throw new Error(
                "walletsStoreSlice.sendTransaction: Incorrect account id",
            );
        }

        const { deployId, subscribe } = await SdkWalletService.transfer(
            {
                walletId,
                accountId,
                to,
                amount,
            },
            password,
        );

        const invalidateAccountData = (): void => {
            dispatch(
                walletsApi.util.invalidateTags([
                    { type: WalletsApiTags.BALANCE, id: accountId },
                    { type: WalletsApiTags.HISTORY, id: accountId },
                ]),
            );
        };

        subscribe({
            onConfirmed: invalidateAccountData,
            onError: invalidateAccountData,
        });

        dispatch(
            walletsApi.util.invalidateTags([
                { type: WalletsApiTags.HISTORY, id: accountId },
            ]),
        );

        return { deployId };
    },
);

export const bridgeLock = createAsyncThunk(
    "wallets-store/bridgeLock",
    async ({
        from,
        recipient,
        amountBaseUnits,
        destChainId,
        bridgeUri,
        password,
        network,
    }: {
        from: Account;
        recipient: string;
        amountBaseUnits: string;
        destChainId: number;
        bridgeUri: string;
        password?: string;
        network: Network;
    }) => {
        if (!SecureStorage.hasSessionToken()) {
            throw new Error("Session expired. Please login again.");
        }

        let privateKey: string | undefined;

        const unlockedAccount = SecureStorage.getUnlockedAccount(from.id);
        if (unlockedAccount?.privateKey) {
            privateKey = unlockedAccount.privateKey;
        } else if (password) {
            const unlocked = await SecureStorage.unlockAccount(
                from.id,
                password,
            );
            if (unlocked?.privateKey) {
                privateKey = unlocked.privateKey;
            }
        }

        if (!privateKey) {
            throw new Error(
                "Account is locked. Please provide password or unlock account first.",
            );
        }

        if (!network.validatorUrl) {
            throw new Error(
                `Network "${network.name}" has no validator URL configured`,
            );
        }

        const rchain = new RChainService(
            network.validatorUrl,
            network.observerUrl,
            undefined,
            undefined,
            network.indexerUrl,
        );

        const deployId = await rchain.bridgeLock(
            amountBaseUnits,
            recipient,
            destChainId,
            privateKey,
            bridgeUri,
        );

        return { deployId };
    },
);
