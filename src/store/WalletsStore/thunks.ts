import { createAsyncThunk } from "@reduxjs/toolkit";
import { generateRandomGasFee } from "constants/gas";
import { SdkWalletService } from "sdk";
import { RChainService } from "services/rchain";
import { SecureStorage } from "services/secureStorage";
import { AuthState } from "store/authSlice";
import {
    Account,
    IAccountMeta,
    Network,
    Transaction,
    WalletStoreState,
} from "types/wallet";
import { IAccountDefaultUpdateFieldsPayload } from "./walletsStoreSlice";
import {
    getAccountFromWalletsMeta,
    getWalletAndAccountFromWalletsMeta,
    IWalletAndAccountPathFromMeta,
} from "./helpers";
import { RootState } from "store";

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

export const updateAccountName = createAsyncThunk<
    IAccountUpdateNameResponse,
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
                account: targetAccount as IAccountMeta,
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

export const fetchTransactionHistory = createAsyncThunk(
    "wallets-store/fetchTransactionHistory",
    async (
        {
            address,
            publicKey,
            limit = 50,
        }: { address: string; publicKey: string; limit?: number },
        { getState },
    ) => {
        const state = getState() as { wallet: WalletStoreState };
        const { selectedNetwork } = state.wallet;

        if (!selectedNetwork) {
            throw new Error("No network selected");
        }

        const validatorUrl = selectedNetwork.url?.trim();
        if (!validatorUrl) {
            throw new Error(
                `Network "${selectedNetwork.name}" has no validator URL configured`,
            );
        }

        const rchain = new RChainService(
            validatorUrl,
            selectedNetwork.readOnlyUrl,
            selectedNetwork.adminUrl,
            selectedNetwork.shardId,
            selectedNetwork.graphqlUrl,
        );
        const transactions = await rchain.fetchTransactionHistory(
            address,
            publicKey,
            limit,
        );

        return transactions;
    },
);

export const sendTransaction = createAsyncThunk(
    "wallets-store/sendTransaction",
    async ({
        from,
        to,
        amount,
        password,
        network,
    }: {
        from: Account;
        to: string;
        amount: string;
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

        const amountNum = parseFloat(amount);
        const atomicAmount = Math.floor(amountNum * 100000000 + 0.5).toString();

        if (to.trim().toLowerCase().startsWith("0x")) {
            throw new Error("Sending to Ethereum addresses is not supported");
        }

        const deployId = await rchain.transfer(
            from.revAddress,
            to,
            atomicAmount,
            privateKey,
        );

        const transaction: Transaction = {
            id: deployId,
            deployId,
            from: from.revAddress,
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
