import {
    IAccountDefaultUpdateFieldsPayload,
    updateTransactionStatus,
} from "./walletsStoreSlice";
import { Account, IAccountMeta, Network } from "types/wallet";
import { SecureStorage } from "services/secureStorage";
import { generateRandomGasFee } from "constants/gas";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Address } from "@asichain/asi-wallet-sdk";
import { Transaction } from "types/transactions";
import { RChainService } from "services/rchain";
import { SdkWalletService } from "sdk";
import { RootState } from "store";
import {
    getAccountFromWalletsMeta,
    getWalletAndAccountFromWalletsMeta,
    IWalletAndAccountPathFromMeta,
} from "./helpers";

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
    async (
        { walletId, accountId }: IAccountRemovePayload,
        { rejectWithValue },
    ) => {
        try {
            await SdkWalletService.removeAccount(walletId, accountId);
            const removedWallet = await SdkWalletService.removeWallet(walletId);

            return {
                walletId,
                accountId,
                removedWalletId: removedWallet.getId(),
                removedSignerId: removedWallet.getSigner().getId(),
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
    password: string;
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

export const fetchBalance = createAsyncThunk<
    IAccountGetBalanceResponse,
    IAccountDefaultGetFieldsPayload,
    { state: RootState }
>(
    "wallets-store/fetchBalance",
    async ({ accountId }, { rejectWithValue, getState }) => {
        const { wallets } = getState().walletsStore;

        const walletAndAccountPath: IWalletAndAccountPathFromMeta | null =
            getWalletAndAccountFromWalletsMeta(wallets, accountId);

        if (!walletAndAccountPath) {
            return rejectWithValue(
                "walletsStoreSlice.fetchBalance: Incorrect account id",
            );
        }

        const { wallet, account } = walletAndAccountPath;

        if (wallet.isUnlocked && wallet.id) {
            const balance = await SdkWalletService.getAvailableBalance(
                wallet.id,
                accountId,
            );

            return { accountId, balance };
        }

        const balance = await SdkWalletService.getBalance(account.address);

        return { accountId, balance };
    },
);

export const fetchTransactionHistory = createAsyncThunk<
    Transaction[],
    { address: string; publicKey: string; limit?: number }
>(
    "wallets-store/fetchTransactionHistory",
    async ({ address, publicKey, limit = 50 }) => {
        const history = await SdkWalletService.getTransactionsHistory(
            address,
            publicKey,
            {
                limit,
            },
        );

        return history.map((tx) => ({
            id: tx.id,
            deployId: tx.deployId ?? tx.id,
            from: tx.from,
            to: tx.to ?? "",
            amount: tx.amount ?? "",
            timestamp: tx.timestamp.toString(),
            status: tx.status === "confirmed" ? "completed" : tx.status,
            gasCost: tx.type === "send" ? generateRandomGasFee() : undefined,
        }));
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
        //TODO: Updated after auth redesign
        // if (!SecureStorage.hasSessionToken()) {
        //     throw new Error("Session expired. Please login again.");
        // }

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

        const deployId: string = await SdkWalletService.transfer(
            {
                walletId,
                accountId,
                to,
                amount,
            },
            password,
        );

        SdkWalletService.watchDeploy(deployId, {
            onConfirmed: () => {
                dispatch(
                    updateTransactionStatus({ deployId, status: "completed" }),
                );
            },
            onError: (error: Error) => {
                dispatch(
                    updateTransactionStatus({
                        deployId,
                        status: "failed",
                        error: error.message,
                    }),
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
            gasCost: generateRandomGasFee(),
        };

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

        const validatorUrl = network.url?.trim();
        if (!validatorUrl) {
            throw new Error(
                `Network "${network.name}" has no validator URL configured`,
            );
        }

        const rchain = new RChainService(
            validatorUrl,
            network.readOnlyUrl,
            network.adminUrl,
            network.shardId,
            network.graphqlUrl,
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
