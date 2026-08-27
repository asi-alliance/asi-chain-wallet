import { IAccountDefaultUpdateFieldsPayload } from ".";
import { Account, IAccountMeta, Network } from "types/wallet";
import { SecureStorage } from "services/secureStorage";
import { generateRandomGasFee } from "constants/gas";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Address } from "@asichain/asi-wallet-sdk";
import { Transaction } from "types/transactions";
import { RChainService } from "services/rchain";
import { SdkWalletService } from "sdk";
import { RootState } from "store";
import { walletsApi, IAccountQueryArgs, WalletsApiTags } from "./api";
import { getAccountFromWalletsMeta, updateTransactionStatus } from "./helpers";
import { MaybeDrafted } from "@reduxjs/toolkit/dist/query/core/buildThunks";

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
                getAccountFromWalletsMeta(
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
    Transaction,
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

        const fromAccount: IAccountMeta | null = getAccountFromWalletsMeta(
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

        const historyArgs: IAccountQueryArgs = {
            accountId,
            networkId: getState().walletsStore.selectedNetwork.id,
        };

        subscribe({
            onConfirmed: () => {
                dispatch(
                    walletsApi.util.invalidateTags([
                        { type: WalletsApiTags.BALANCE, id: accountId },
                        { type: WalletsApiTags.HISTORY, id: accountId },
                    ]),
                );
            },
            onError: (error: Error) => {
                dispatch(
                    walletsApi.util.updateQueryData(
                        "getTransactionHistory",
                        historyArgs,
                        (transactionsDraft: MaybeDrafted<Transaction[]>) => {
                            updateTransactionStatus(transactionsDraft, {
                                deployId,
                                status: "failed",
                                error: error.message,
                            });
                        },
                    ),
                );

                dispatch(
                    walletsApi.util.invalidateTags([
                        { type: WalletsApiTags.BALANCE, id: accountId },
                    ]),
                );
            },
        });

        const transaction: Transaction = {
            id: deployId,
            deployId,
            from: fromAccount.address,
            to,
            amount,
            timestamp: new Date().toString(),
            status: "pending",
            type: "send",
            gasCost: generateRandomGasFee(),
        };

        dispatch(
            walletsApi.util.updateQueryData(
                "getTransactionHistory",
                historyArgs,
                (transactionsDraft: MaybeDrafted<Transaction[]>) => {
                    transactionsDraft.unshift(transaction);
                },
            ),
        );

        return transaction;
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
