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
import { getAccountFromWalletsMeta } from "./helpers";
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

export const fetchBalance = createAsyncThunk(
    "wallets-store/fetchBalance",
    async (
        {
            accountId,
            address,
            network,
            forceRefresh = false,
        }: {
            accountId: string;
            address: string;
            network: Network;
            forceRefresh?: boolean;
        },
        { getState },
    ) => {
        const state = getState() as {
            auth: AuthState;
            walletsStore: WalletStoreState;
        };
        const knownBalance = state.walletsStore.balances[accountId] ?? "0";

        if (
            !state.auth.isAuthenticated ||
            state.auth.unlockedAccounts.length === 0
        ) {
            return { accountId, balance: knownBalance };
        }

        if (!network.readOnlyUrl || !network.readOnlyUrl.trim()) {
            return { accountId, balance: knownBalance };
        }

        const rchain = new RChainService(
            network.url,
            network.readOnlyUrl,
            network.adminUrl,
            network.shardId,
            network.graphqlUrl,
        );
        let atomicBalance = await rchain.getBalance(address, forceRefresh);

        const balance = (parseInt(atomicBalance) / 100000000).toString();

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
