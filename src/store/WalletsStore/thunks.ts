import { IAccountDefaultUpdateFieldsPayload } from ".";
import {
    Account,
    IAccountMeta,
    IUnlockedAccountMeta,
    Network,
    TCustomNetwork,
} from "types/wallet";
import { SecureStorage } from "services/secureStorage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
    Address,
    INetworkConfig,
    INetworkUpdate,
    NetworkId,
    NetworkName,
} from "@asichain/asi-wallet-sdk";
import { RChainService } from "services/rchain";
import { SdkWalletService } from "sdk";
import { RootState } from "store";
import {
    persistSelectedNetworkId,
    readSelectedNetworkId,
} from "constants/networks";
import { getErrorMessage } from "utils/helpers";
import { walletsApi, WalletsApiTags } from "./api";
import { getUnlockedAccountFromWalletsMeta } from "./helpers";

export const loadWalletsFromStorage = createAsyncThunk(
    "wallets-store/loadWalletsFromStorage",
    () => SdkWalletService.loadWallets(),
);

export interface IAccountRemovePayload {
    walletId: string;
    accountId: string;
}

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

export interface IAddNetworkPayload {
    name: NetworkName;
    config: INetworkConfig;
}

export interface ICustomNetworkDefaultGetFieldsPayload {
    id: NetworkId;
}

export interface IUpdateNetworkPayload extends ICustomNetworkDefaultGetFieldsPayload {
    update: INetworkUpdate;
}

export interface IRemoveNetworkResponse extends ICustomNetworkDefaultGetFieldsPayload {
    selectedNetworkId: NetworkId;
}

export interface IInitializeNetworksResponse {
    customNetworks: TCustomNetwork[];
    selectedNetwork: TCustomNetwork | null;
}

export const removeWallet = createAsyncThunk(
    "walletsStore/removeWallet",
    async ({ walletId }: { walletId: string }, { rejectWithValue }) => {
        try {
            const removedWallet = await SdkWalletService.removeWallet(walletId);

            return {
                removedWalletId: removedWallet.getId(),
                removedSignerId: removedWallet.getSigner().getId(),
            };
        } catch (error) {
            return rejectWithValue(error);
        }
    },
);

export const removeAccount = createAsyncThunk(
    "walletsStore/removeAccount",
    async (
        { walletId, accountId }: IAccountRemovePayload,
        { rejectWithValue },
    ) => {
        try {
            await SdkWalletService.removeAccount(walletId, accountId);

            return { walletId, accountId };
        } catch (error) {
            return rejectWithValue(error);
        }
    },
);

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
                rejectWithValue(
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

export const initializeNetworks = createAsyncThunk<IInitializeNetworksResponse>(
    "walletsStore/initializeNetworks",
    () => {
        const customNetworks: TCustomNetwork[] =
            SdkWalletService.getCustomNetworks();

        const persistedNetworkId = readSelectedNetworkId();

        const persistedCustomNetwork =
            customNetworks.find(
                (network: TCustomNetwork) => network.id === persistedNetworkId,
            ) ?? null;

        if (!persistedCustomNetwork) {
            return {
                customNetworks,
                selectedNetwork: null,
            };
        }

        try {
            SdkWalletService.setNetwork(persistedCustomNetwork.id);
        } catch (error) {
            console.error("Failed to restore selected network:", error);

            return {
                customNetworks,
                selectedNetwork: null,
            };
        }

        return {
            customNetworks,
            selectedNetwork: persistedCustomNetwork,
        };
    },
);

export const selectNetwork = createAsyncThunk<
    Network,
    ICustomNetworkDefaultGetFieldsPayload,
    { state: RootState; rejectValue: string }
>(
    "walletsStore/selectNetwork",
    (
        { id }: ICustomNetworkDefaultGetFieldsPayload,
        { getState, rejectWithValue },
    ) => {
        const { networks, selectedNetwork } = getState().walletsStore;

        const network = networks.find(
            (networkMeta: Network) => networkMeta.id === id,
        );

        if (!network) {
            return rejectWithValue(`Unknown network "${id}"`);
        }

        if (selectedNetwork.id === network.id) {
            return network;
        }

        try {
            SdkWalletService.setNetwork(network.id);
        } catch (error) {
            return rejectWithValue(
                getErrorMessage(error, `Failed to switch to "${network.name}"`),
            );
        }

        persistSelectedNetworkId(network.id);

        return network;
    },
);

export const addCustomNetwork = createAsyncThunk<
    TCustomNetwork,
    IAddNetworkPayload,
    { rejectValue: string }
>(
    "walletsStore/addCustomNetwork",
    async ({ name, config }: IAddNetworkPayload, { rejectWithValue }) => {
        try {
            return await SdkWalletService.addCustomNetwork(name, config);
        } catch (error) {
            return rejectWithValue(
                getErrorMessage(error, "Failed to create custom network"),
            );
        }
    },
);

export const updateCustomNetwork = createAsyncThunk<
    TCustomNetwork,
    IUpdateNetworkPayload,
    { rejectValue: string }
>(
    "walletsStore/updateCustomNetwork",
    async ({ id, update }: IUpdateNetworkPayload, { rejectWithValue }) => {
        try {
            return await SdkWalletService.updateCustomNetwork(id, update);
        } catch (error) {
            return rejectWithValue(
                getErrorMessage(error, "Failed to update custom network"),
            );
        }
    },
);

export const removeCustomNetwork = createAsyncThunk<
    IRemoveNetworkResponse,
    ICustomNetworkDefaultGetFieldsPayload,
    { rejectValue: string }
>(
    "walletsStore/removeCustomNetwork",
    async (
        { id }: ICustomNetworkDefaultGetFieldsPayload,
        { rejectWithValue },
    ) => {
        try {
            await SdkWalletService.removeCustomNetwork(id);

            const selectedNetworkId: NetworkId =
                SdkWalletService.getActiveNetworkId();

            persistSelectedNetworkId(selectedNetworkId);

            return {
                id,
                selectedNetworkId,
            };
        } catch (error) {
            return rejectWithValue(
                getErrorMessage(error, "Failed to remove custom network"),
            );
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
