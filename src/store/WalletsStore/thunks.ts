import {
    deployStatusChanged,
    deployWatchUnresolved,
    IAccountDefaultUpdateFieldsPayload,
} from ".";
import { AnyAction } from "@reduxjs/toolkit";
import {
    BRIDGE_LOCK_MAX_GAS_COST,
    BRIDGE_LOCK_PHLO_LIMIT,
    BRIDGE_LOCK_PHLO_PRICE,
    RChainService,
} from "services/rchain";
import {
    IAccountMeta,
    IUnlockedAccountMeta,
    IWalletMeta,
    Network,
    TCustomNetwork,
} from "types/wallet";
import {
    Address,
    DeployStatus,
    IDeployStatusResult,
    IDeployWatchCallbacks,
    INetworkConfig,
    INetworkUpdate,
    NetworkId,
    NetworkName,
    SignedResult,
    getErrorMessage,
    IKeyfileImportPreview,
    IWalletKeyfile,
} from "@asichain/asi-wallet-sdk";
import { SdkWalletService } from "sdk";
import { WalletPreferencesStorage } from "services/walletPreferences";
import { RootState } from "store";
import { createAppAsyncThunk, TAppThunk } from "store/appThunk";
import { selectIsNetworkOperationPending } from "store/NetworkActivity";
import { walletsApi, WalletsApiTags } from "./api";
import {
    getUnlockedAccountFromWalletsMeta,
    getUnlockedWalletAndAccountFromWalletsMeta,
} from "./helpers";

const FALLBACK_SEND_TRANSACTION_UNRESOLVED_MESSAGE: string =
    "The wallet stopped tracking this transfer before it was finalized";

const FALLBACK_DEPLOY_CONTRACT_UNRESOLVED_MESSAGE: string =
    "The wallet stopped tracking this deploy before it was finalized";

interface IDeployWatchCallbacksOptions {
    deployId: string;
    dispatch: (action: AnyAction) => void;
    invalidateAccountData: () => void;
    fallbackUnresolvedMessage: string;
}

const buildDeployWatchCallbacks = ({
    deployId,
    dispatch,
    invalidateAccountData,
    fallbackUnresolvedMessage,
}: IDeployWatchCallbacksOptions): IDeployWatchCallbacks => ({
    onStatus: (result: IDeployStatusResult) =>
        dispatch(
            deployStatusChanged({
                deployId,
                status:
                    result.status === DeployStatus.CHECK_ERROR
                        ? DeployStatus.DEPLOYING
                        : result.status,
            }),
        ),
    onConfirmed: () => {
        dispatch(
            deployStatusChanged({ deployId, status: DeployStatus.FINALIZED }),
        );
        invalidateAccountData();
    },
    onError: (error: Error) => {
        dispatch(
            deployWatchUnresolved({
                deployId,
                reason: getErrorMessage(error, fallbackUnresolvedMessage),
            }),
        );
        invalidateAccountData();
    },
});

export const loadWalletsFromStorage = createAppAsyncThunk(
    "wallets-store/loadWalletsFromStorage",
    (_, { extra: { walletService } }) => walletService.loadWallets(),
);

export interface IImportKeyfileAccountsPayload {
    keyfile: string;
    password: string;
    accountIndexes?: number[];
}

export const importKeyfileAccounts = createAppAsyncThunk<
    IWalletMeta,
    IImportKeyfileAccountsPayload
>(
    "wallets-store/importKeyfileAccounts",
    async (
        { keyfile, password, accountIndexes },
        { extra: { walletService } },
    ) => {
        const { signerId } = await walletService.importKeyfileAccounts(
            keyfile,
            password,
            accountIndexes ? { accountIndexes } : undefined,
        );

        return walletService.getWalletMetaBySignerId(signerId);
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

export const selectAccount = createAppAsyncThunk<
    string,
    string,
    { rejectValue: string }
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

export const removeWallet = createAppAsyncThunk(
    "walletsStore/removeWallet",
    async (
        { walletId }: { walletId: string },
        { rejectWithValue, extra: { walletService } },
    ) => {
        try {
            const removedWallet = await walletService.removeWallet(walletId);
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

export const removeAccount = createAppAsyncThunk<
    IAccountRemoveResponse,
    IAccountRemovePayload
>(
    "walletsStore/removeAccount",
    async (
        { walletId, accountId }: IAccountRemovePayload,
        { getState, rejectWithValue, extra: { walletService } },
    ) => {
        try {
            await walletService.removeAccount(walletId, accountId);

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

export const updateAccountName = createAppAsyncThunk<
    Omit<IAccountUpdateNamePayload, "walletId">,
    IAccountUpdateNamePayload
>(
    "walletsStore/updateAccountName",
    async (
        payload: IAccountUpdateNamePayload,
        { rejectWithValue, getState, extra: { walletService } },
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

            await walletService.renameAccount(walletId, accountId, name);

            return {
                accountId,
                name,
            };
        } catch (error: unknown) {
            return rejectWithValue(error);
        }
    },
);

export const initializeNetworks = createAppAsyncThunk<IInitializeNetworksResponse>(
    "walletsStore/initializeNetworks",
    (_, { extra: { walletService } }) => {
        const customNetworks: TCustomNetwork[] =
            walletService.getCustomNetworks();

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
            walletService.setNetwork(persistedCustomNetwork.id);
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

export const selectNetwork = createAppAsyncThunk<
    Network,
    ICustomNetworkDefaultGetFieldsPayload,
    { rejectValue: string }
>(
    "walletsStore/selectNetwork",
    (
        { id }: ICustomNetworkDefaultGetFieldsPayload,
        { getState, rejectWithValue, extra: { walletService } },
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
            walletService.setNetwork(network.id);
        } catch (error) {
            return rejectWithValue(
                getErrorMessage(error, `Failed to switch to "${network.name}"`),
            );
        }

        WalletPreferencesStorage.setSelectedNetworkId(network.id);

        return network;
    },
);

export const addCustomNetwork = createAppAsyncThunk<
    TCustomNetwork,
    IAddNetworkPayload,
    { rejectValue: string }
>(
    "walletsStore/addCustomNetwork",
    async (
        { name, config }: IAddNetworkPayload,
        { rejectWithValue, extra: { walletService } },
    ) => {
        try {
            return await walletService.addCustomNetwork(name, config);
        } catch (error) {
            return rejectWithValue(
                getErrorMessage(error, "Failed to create custom network"),
            );
        }
    },
);

export const updateCustomNetwork = createAppAsyncThunk<
    TCustomNetwork,
    IUpdateNetworkPayload,
    { rejectValue: string }
>(
    "walletsStore/updateCustomNetwork",
    async (
        { id, update }: IUpdateNetworkPayload,
        { rejectWithValue, extra: { walletService } },
    ) => {
        try {
            return await walletService.updateCustomNetwork(id, update);
        } catch (error) {
            return rejectWithValue(
                getErrorMessage(error, "Failed to update custom network"),
            );
        }
    },
);

export const removeCustomNetwork = createAppAsyncThunk<
    IRemoveNetworkResponse,
    ICustomNetworkDefaultGetFieldsPayload,
    { rejectValue: string }
>(
    "walletsStore/removeCustomNetwork",
    async (
        { id }: ICustomNetworkDefaultGetFieldsPayload,
        { rejectWithValue, extra: { walletService } },
    ) => {
        try {
            await walletService.removeCustomNetwork(id);

            const selectedNetworkId: NetworkId =
                walletService.getActiveNetworkId();

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

export const sendTransaction = createAppAsyncThunk<
    { deployId: string },
    ITransferPayload
>(
    "wallets-store/sendTransaction",
    async (
        { walletId, accountId, to, amount, password }: ITransferPayload,
        { getState, dispatch, extra: { walletService } },
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

        const { deployId, subscribe } = await walletService.transfer(
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

        subscribe(
            buildDeployWatchCallbacks({
                deployId,
                dispatch,
                invalidateAccountData,
                fallbackUnresolvedMessage:
                    FALLBACK_SEND_TRANSACTION_UNRESOLVED_MESSAGE,
            }),
        );

        invalidateAccountData();

        return { deployId };
    },
);

export interface IDeployContractPayload {
    walletId: string;
    accountId: string;
    term: string;
    phloLimit: number;
    password?: string;
}

export const deployContract = createAppAsyncThunk<
    { deployId: string },
    IDeployContractPayload
>(
    "wallets-store/deployContract",
    async (
        {
            walletId,
            accountId,
            term,
            phloLimit,
            password,
        }: IDeployContractPayload,
        { getState, dispatch, extra: { walletService } },
    ) => {
        const deployerAccount: IUnlockedAccountMeta | null =
            getUnlockedAccountFromWalletsMeta(
                getState().walletsStore.wallets,
                accountId,
            );

        if (!deployerAccount) {
            throw new Error(
                "walletsStoreSlice.deployContract: Incorrect account id",
            );
        }

        const { deployId, subscribe } = await walletService.deploy(
            { walletId, accountId, term, phloLimit },
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

        subscribe(
            buildDeployWatchCallbacks({
                deployId,
                dispatch,
                invalidateAccountData,
                fallbackUnresolvedMessage:
                    FALLBACK_DEPLOY_CONTRACT_UNRESOLVED_MESSAGE,
            }),
        );

        invalidateAccountData();

        return { deployId };
    },
);

export interface IBridgeLockPayload {
    walletId: string;
    accountId: string;
    recipient: string;
    amount: string;
    destChainId: number;
    bridgeUri: string;
    password?: string;
    network: Network;
}

export const bridgeLock = createAppAsyncThunk<
    { deployId: string },
    IBridgeLockPayload
>(
    "wallets-store/bridgeLock",
    async (
        {
            walletId,
            accountId,
            recipient,
            amount,
            destChainId,
            bridgeUri,
            password,
            network,
        }: IBridgeLockPayload,
        { dispatch, extra: { walletService } },
    ) => {
        const rchain = new RChainService(
            network.validatorUrl,
            network.observerUrl,
            undefined,
            undefined,
            network.indexerUrl,
        );

        const atomicAmount: bigint = SdkWalletService.toAtomicAmount(amount);

        const lockTerm: string = rchain.buildBridgeLockTerm(
            atomicAmount.toString(),
            recipient,
            destChainId,
            bridgeUri,
        );

        const signedLock: SignedResult = await walletService.signDeploy(
            {
                walletId,
                accountId,
                term: lockTerm,
                phloLimit: BRIDGE_LOCK_PHLO_LIMIT,
                phloPrice: BRIDGE_LOCK_PHLO_PRICE,
            },
            password,
        );

        const deployId: string = signedLock.signature;

        const reservation = await walletService.addTransactionReservation(
            {
                walletId,
                accountId,
                kind: "deploy",
                deployId,
                term: lockTerm,
                pendingAmount:
                    atomicAmount +
                    BRIDGE_LOCK_MAX_GAS_COST,
                gasCost: BRIDGE_LOCK_MAX_GAS_COST,
            },
            password,
        );

        try {
            await rchain.submitDeploy(signedLock);
        } catch (error: unknown) {
            await walletService.removeTransactionReservation(
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

        walletService.watchDeploy(deployId, {
            onConfirmed: invalidateAccountData,
            onError: invalidateAccountData,
        });

        invalidateAccountData();

        return { deployId };
    },
);

export interface IExportWalletKeyfilePayload {
    walletId: string;
    password: string;
}

export const exportWalletKeyfile =
    ({
        walletId,
        password,
    }: IExportWalletKeyfilePayload): TAppThunk<Promise<IWalletKeyfile>> =>
    (_dispatch, _getState, { walletService }) =>
        walletService.exportWalletKeyfile(walletId, password);

export interface IPreviewKeyfileImportPayload {
    keyfile: string;
    password: string;
}

export const previewKeyfileImport =
    ({
        keyfile,
        password,
    }: IPreviewKeyfileImportPayload): TAppThunk<
        Promise<IKeyfileImportPreview>
    > =>
    (_dispatch, _getState, { walletService }) =>
        walletService.previewWalletKeyfileImport(keyfile, password);

export const exploreDeploy =
    (term: string): TAppThunk<Promise<unknown>> =>
    (_dispatch, _getState, { walletService }) =>
        walletService.exploreDeploy(term);

export const checkWalletUnlocked =
    (walletId: string): TAppThunk<boolean> =>
    (_dispatch, _getState, { walletService }) =>
        walletService.isWalletUnlocked(walletId);
