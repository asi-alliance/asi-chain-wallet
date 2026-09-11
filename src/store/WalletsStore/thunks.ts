import {
    deployConfirmed,
    deployFailed,
    IAccountDefaultUpdateFieldsPayload,
} from ".";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { BRIDGE_LOCK_PHLO_LIMIT, RChainService } from "services/rchain";
import {
    IAccountMeta,
    IUnlockedAccountMeta,
    IWalletMeta,
    Network,
    TCustomNetwork,
} from "types/wallet";
import {
    Address,
    GasFee,
    INetworkConfig,
    INetworkUpdate,
    NetworkId,
    NetworkName,
    SignedResult,
    getErrorMessage,
} from "@asichain/asi-wallet-sdk";
import { SdkWalletService } from "sdk";
import { WalletPreferencesStorage } from "services/walletPreferences";
import { RootState } from "store";
import { selectIsNetworkOperationPending } from "store/networkOperationSlice";
import { walletsApi, WalletsApiTags } from "./api";
import {
    getUnlockedAccountFromWalletsMeta,
    getUnlockedWalletAndAccountFromWalletsMeta,
} from "./helpers";

const FALLBACK_SEND_TRANSACTION_ERROR_MESSAGE: string =
    "Transaction failed on chain";

export const loadWalletsFromStorage = createAsyncThunk(
    "wallets-store/loadWalletsFromStorage",
    () => SdkWalletService.loadWallets(),
);

export interface IImportKeyfileAccountsPayload {
    keyfile: string;
    password: string;
    accountIndexes?: number[];
}

export const importKeyfileAccounts = createAsyncThunk<
    IWalletMeta,
    IImportKeyfileAccountsPayload
>(
    "wallets-store/importKeyfileAccounts",
    async ({ keyfile, password, accountIndexes }) => {
        const { signerId } = await SdkWalletService.importKeyfileAccounts(
            keyfile,
            password,
            accountIndexes ? { accountIndexes } : undefined,
        );

        return SdkWalletService.getWalletMetaBySignerId(signerId);
    },
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

export const initializeNetworks = createAsyncThunk<IInitializeNetworksResponse>(
    "walletsStore/initializeNetworks",
    () => {
        const customNetworks: TCustomNetwork[] =
            SdkWalletService.getCustomNetworks();

        const persistedNetworkId =
            WalletPreferencesStorage.getSelectedNetworkId();

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
        const state: RootState = getState();

        if (selectIsNetworkOperationPending(state)) {
            return rejectWithValue(
                "Network cannot be changed while an operation is awaiting confirmation",
            );
        }

        const { networks, selectedNetwork } = state.walletsStore;

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

        WalletPreferencesStorage.setSelectedNetworkId(network.id);

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

            WalletPreferencesStorage.setSelectedNetworkId(selectedNetworkId);

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
            onConfirmed: () => {
                dispatch(deployConfirmed(deployId));
                invalidateAccountData();
            },
            onError: (error: Error) => {
                dispatch(
                    deployFailed({
                        deployId,
                        error: getErrorMessage(
                            error,
                            FALLBACK_SEND_TRANSACTION_ERROR_MESSAGE,
                        ),
                    }),
                );
                invalidateAccountData();
            },
        });

        invalidateAccountData();

        return { deployId };
    },
);

export interface IBridgeLockPayload {
    walletId: string;
    accountId: string;
    recipient: string;
    amountBaseUnits: string;
    destChainId: number;
    bridgeUri: string;
    password?: string;
    network: Network;
}

const BRIDGE_LOCK_GAS_COST: bigint = GasFee.MAX;

export const bridgeLock = createAsyncThunk<
    { deployId: string },
    IBridgeLockPayload
>(
    "wallets-store/bridgeLock",
    async (
        {
            walletId,
            accountId,
            recipient,
            amountBaseUnits,
            destChainId,
            bridgeUri,
            password,
            network,
        }: IBridgeLockPayload,
        { dispatch },
    ) => {
        const rchain = new RChainService(
            network.validatorUrl,
            network.observerUrl,
            undefined,
            undefined,
            network.indexerUrl,
        );

        const lockTerm: string = rchain.buildBridgeLockTerm(
            amountBaseUnits,
            recipient,
            destChainId,
            bridgeUri,
        );

        const signedLock: SignedResult = await SdkWalletService.signDeploy(
            {
                walletId,
                accountId,
                term: lockTerm,
                phloLimit: BRIDGE_LOCK_PHLO_LIMIT,
            },
            password,
        );

        const deployId: string = signedLock.signature;

        const reservation = await SdkWalletService.addTransactionReservation(
            {
                walletId,
                accountId,
                kind: "deploy",
                deployId,
                term: lockTerm,
                pendingAmount: BigInt(amountBaseUnits) + BRIDGE_LOCK_GAS_COST,
                gasCost: BRIDGE_LOCK_GAS_COST,
            },
            password,
        );

        try {
            await rchain.submitDeploy(signedLock);
        } catch (error: unknown) {
            await SdkWalletService.removeTransactionReservation(
                walletId,
                reservation.id,
            ).catch((releaseError: unknown) =>
                console.error(
                    "bridgeLock: failed to release the reservation of the rejected deploy:",
                    releaseError,
                ),
            );

            throw error;
        }

        const invalidateAccountData = (): void => {
            dispatch(
                walletsApi.util.invalidateTags([
                    { type: WalletsApiTags.BALANCE, id: accountId },
                    { type: WalletsApiTags.HISTORY, id: accountId },
                ]),
            );
        };

        SdkWalletService.watchDeploy(deployId, {
            onConfirmed: invalidateAccountData,
            onError: invalidateAccountData,
        });

        invalidateAccountData();

        return { deployId };
    },
);
