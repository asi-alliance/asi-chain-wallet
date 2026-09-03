import { IAccountDefaultUpdateFieldsPayload } from ".";
import { IAccountMeta, IUnlockedAccountMeta, Network } from "types/wallet";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Address, GasFee } from "@asichain/asi-wallet-sdk";
import { IPreparedDeploy, RChainService } from "services/rchain";
import { SdkWalletService } from "sdk";
import { RootState } from "store";
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

        const preparedLock: IPreparedDeploy = await rchain.prepareBridgeLock({
            amountBaseUnits,
            recipient,
            destChainId,
            bridgeUri,
            sign: (deployData) =>
                SdkWalletService.signDeploy({
                    walletId,
                    accountId,
                    deployData,
                    password,
                }),
        });

        const reservation = await SdkWalletService.addTransactionReservation(
            {
                walletId,
                accountId,
                kind: "deploy",
                deployId: preparedLock.deployId,
                term: preparedLock.term,
                pendingAmount: BigInt(amountBaseUnits) + BRIDGE_LOCK_GAS_COST,
                gasCost: BRIDGE_LOCK_GAS_COST,
            },
            password,
        );

        try {
            await rchain.submitDeploy(preparedLock);
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

        SdkWalletService.watchDeploy(preparedLock.deployId, {
            onConfirmed: invalidateAccountData,
            onError: invalidateAccountData,
        });

        invalidateAccountData();

        return { deployId: preparedLock.deployId };
    },
);
